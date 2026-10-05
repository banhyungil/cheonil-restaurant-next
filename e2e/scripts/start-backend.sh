#!/usr/bin/env bash
# e2e 용 백엔드 기동 — Playwright webServer 가 실행한다.
#
# 1. 빈 postgres 컨테이너(cheonil-e2e-db, 15433)를 새로 띄운다 — 매 실행 깨끗한 DB
# 2. 백엔드 jar 를 빌드해 18081 로 실행 — Flyway 가 스키마를 만든다
#
# 운영 스택(cheonil-db 5432 / cheonil-server 8080)과 포트·컨테이너가 겹치지 않는다.
# gradle bootRun 대신 java -jar 를 exec 하는 이유: bootRun 은 gradle daemon 이 앱 JVM 을 fork 해서
# Playwright 가 프로세스를 종료해도 앱이 남을 수 있다.
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-../cheonil-restaurant-spring}"
DB_CONTAINER=cheonil-e2e-db

docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
docker run -d --rm --name "$DB_CONTAINER" -p 15433:5432 \
  -e POSTGRES_PASSWORD=e2e -e POSTGRES_DB=cheonil postgres:17 >/dev/null

# 초기화(initdb) 중에는 unix socket 만 열리므로 TCP 로 확인해야 실제 준비 완료
until docker exec "$DB_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do
  sleep 1
done

cd "$BACKEND_DIR"
./gradlew bootJar -x test --quiet
JAR=$(ls build/libs/*.jar | grep -v -- '-plain.jar' | head -1)

# 백엔드는 Java 25 toolchain 으로 빌드된다 — PATH 의 java 가 더 낮을 수 있어 25 를 직접 찾는다.
# 다른 경로를 쓰려면 E2E_JAVA_HOME 지정.
JAVA_HOME_25="${E2E_JAVA_HOME:-$(/usr/libexec/java_home -v 25 2>/dev/null || true)}"
JAVA="${JAVA_HOME_25:+$JAVA_HOME_25/bin/}java"

# 마스터 seed(db/seed) 는 제외 — 시나리오가 단위 / 제품 등을 직접 만들어 검증하므로 빈 DB 에서 시작.
exec env \
  SERVER_PORT=18081 \
  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15433/cheonil \
  SPRING_DATASOURCE_USERNAME=postgres \
  SPRING_DATASOURCE_PASSWORD=e2e \
  SPRING_FLYWAY_LOCATIONS=classpath:db/migration \
  "$JAVA" -jar "$JAR"
