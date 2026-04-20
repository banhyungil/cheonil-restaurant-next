<script setup lang="ts">
import { ref } from 'vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1, '매장명을 입력하세요'),
  category: z.string().min(1, '분류를 선택하세요'),
  amount: z.coerce.number().min(0, '0 이상이어야 합니다'),
  memo: z.string().max(200, '200자 이하로 작성하세요').optional().or(z.literal('')),
})
type StoreForm = z.infer<typeof schema>

const resolver = zodResolver(schema)
const initialValues: StoreForm = { name: '', category: '', amount: 0, memo: '' }
const categories = [
  { label: '중앙', value: 'CENTER' },
  { label: '농협', value: 'NONGHYUP' },
  { label: '원예', value: 'WONYE' },
]

const toast = useToast()
const confirm = useConfirm()
const submitting = ref(false)

function onSubmit({ valid, values }: FormSubmitEvent) {
  if (!valid) {
    toast.add({ severity: 'warn', summary: '입력 확인', detail: '필수 항목을 확인해주세요', life: 2500 })
    return
  }

  confirm.require({
    message: `"${values.name}" 매장을 등록하시겠습니까?`,
    header: '매장 등록',
    acceptLabel: '등록',
    rejectLabel: '취소',
    accept: async () => {
      submitting.value = true
      await new Promise((r) => setTimeout(r, 600))
      submitting.value = false
      toast.add({ severity: 'success', summary: '등록 완료', detail: values.name, life: 2000 })
    },
  })
}
</script>

<template>
  <div class="max-w-xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">매장 등록 (폼 예시)</h2>

    <Form
      v-slot="$form"
      :resolver
      :initialValues
      :validate-on-value-update="false"
      :validate-on-blur="true"
      class="flex flex-col gap-5"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-1">
        <label for="name" class="text-sm font-semibold">매장명</label>
        <InputText id="name" name="name" placeholder="예: 원예 789" />
        <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
          {{ $form.name.errors?.[0]?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <label for="category" class="text-sm font-semibold">분류</label>
        <Select id="category" name="category" :options="categories" optionLabel="label" optionValue="value" placeholder="선택하세요" />
        <Message v-if="$form.category?.invalid" severity="error" size="small" variant="simple">
          {{ $form.category.errors?.[0]?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <label for="amount" class="text-sm font-semibold">기본 단가</label>
        <InputNumber input-id="amount" name="amount" :min="0" suffix="원" show-buttons />
        <Message v-if="$form.amount?.invalid" severity="error" size="small" variant="simple">
          {{ $form.amount.errors?.[0]?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <label for="memo" class="text-sm font-semibold">비고</label>
        <Textarea id="memo" name="memo" rows="3" placeholder="선택 사항" />
        <Message v-if="$form.memo?.invalid" severity="error" size="small" variant="simple">
          {{ $form.memo.errors?.[0]?.message }}
        </Message>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <Button label="취소" severity="secondary" variant="outlined" type="reset" />
        <Button label="등록" type="submit" :loading="submitting" />
      </div>
    </Form>
  </div>
</template>
