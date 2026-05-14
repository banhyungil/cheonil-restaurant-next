# 로컬 AI 개발환경 구성 (Ollama + Continue + Roo Code)

VSCode에서 로컬 LLM(Ollama)을 사용해 자동완성, 채팅, 에이전트 작업을 구성하는 가이드.

## 구성 개요

| 익스텐션 | 역할 | 사용 모델 (예시) |
| --- | --- | --- |
| **Continue** | 인라인 자동완성, 채팅, 임베딩 | `qwen2.5-coder:1.5b` (FIM), `qwen2.5-coder:7b` (chat), `nomic-embed-text` |
| **Roo Code** | 에이전트 작업 (파일 편집, 명령 실행) | `qwen2.5-coder:7b` 이상 권장 |

> Ollama는 OpenAI 호환 API(`http://localhost:11434`)를 제공하므로 두 익스텐션 모두 동일한 백엔드를 공유한다.

---

## 1. Ollama 설치 및 실행

### 설치

```bash
brew install ollama
```

### 서버 실행

```bash
# 일회성 백그라운드 실행
nohup ollama serve > ~/ollama.log 2>&1 &

# 또는 macOS 서비스로 등록 (권장)
brew services start ollama
```

### 확인

```bash
curl http://localhost:11434/api/tags
lsof -i :11434
```

---

## 2. 모델 다운로드

용도별로 모델을 분리하는 게 효율적이다 (작은 모델 = 빠른 자동완성, 큰 모델 = 정확한 채팅).

```bash
# 자동완성용 (FIM 지원, 빠름)
ollama pull qwen2.5-coder:1.5b-base

# 채팅 / 에이전트용
ollama pull qwen2.5-coder:7b

# 임베딩 (코드베이스 인덱싱)
ollama pull nomic-embed-text
```

### 메모리 가이드 (Apple Silicon 기준)

| RAM | 추천 채팅 모델 |
| --- | --- |
| 8GB | `qwen2.5-coder:3b` |
| 16GB | `qwen2.5-coder:7b` |
| 32GB+ | `qwen2.5-coder:14b`, `deepseek-coder-v2:16b` |

---

## 3. Continue 설정

`~/.continue/config.yaml` (또는 VSCode에서 Continue 아이콘 → 설정 톱니).

```yaml
name: Local Assistant
version: 1.0.0
schema: v1

models:
  - name: Qwen Coder Chat
    provider: ollama
    model: qwen2.5-coder:7b
    roles:
      - chat
      - edit
      - apply

  - name: Qwen Coder Autocomplete
    provider: ollama
    model: qwen2.5-coder:1.5b-base
    roles:
      - autocomplete

  - name: Nomic Embed
    provider: ollama
    model: nomic-embed-text
    roles:
      - embed

context:
  - provider: code
  - provider: docs
  - provider: diff
  - provider: terminal
  - provider: problems
  - provider: folder
  - provider: codebase
```

### 사용법
- `Cmd+L`: 채팅 사이드바 열기
- `Cmd+I`: 인라인 편집 (선택 영역에 지시)
- 타이핑 중 자동으로 인라인 제안 표시 → `Tab` 수락

---

## 4. Roo Code 설정

VSCode 좌측 Roo Code 아이콘 → ⚙️ Settings → **Provider** 선택.

| 항목 | 값 |
| --- | --- |
| API Provider | `Ollama` |
| Base URL | `http://localhost:11434` |
| Model | `qwen2.5-coder:7b` (또는 더 큰 모델) |

### 모드별 모델 분리 (선택)

Roo Code는 모드(Code / Architect / Ask / Debug)별로 다른 모델을 지정할 수 있다.
- **Code/Debug**: 코드 특화 모델 (`qwen2.5-coder`)
- **Architect/Ask**: 추론 강한 일반 모델 (`llama3.1:8b`, `deepseek-r1:7b`)

---

## 5. 운용 팁

### 컨텍스트 길이 늘리기
Ollama 기본 context는 작다 (보통 2K~8K). 코드 작업은 길어야 하므로 Modelfile로 확장:

```bash
cat > Modelfile <<EOF
FROM qwen2.5-coder:7b
PARAMETER num_ctx 16384
EOF

ollama create qwen-coder-16k -f Modelfile
```

생성한 `qwen-coder-16k`를 Continue/Roo Code에서 사용.

### 성능
- 첫 호출은 모델 로딩 때문에 느림 → `OLLAMA_KEEP_ALIVE=24h` 환경변수로 메모리 상주.
- 자동완성 모델과 채팅 모델을 동시에 띄우면 메모리 부족할 수 있음 → RAM 16GB 이하면 한 가지로 통일.

### 로컬 vs 클라우드 한계
- 로컬 모델은 클라우드(Claude, GPT-4)에 비해 **추론력·코드 품질이 명확히 떨어짐**.
- 단순 자동완성·보일러플레이트 생성에는 충분하지만, 복잡한 리팩토링·디버깅은 한계가 있음.
- 보안/오프라인 요구사항이 없다면 Roo Code는 클라우드 모델, 자동완성만 로컬로 쓰는 하이브리드도 좋은 선택.

---

## 참고
- Ollama: https://ollama.com
- Continue: https://docs.continue.dev
- Roo Code: https://docs.roocode.com
