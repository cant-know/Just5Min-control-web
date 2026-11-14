<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="所属分类" prop="categoryId">
        <el-tree-select
          v-model="queryParams.categoryId"
          :data="categoryOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="全部分类"
          check-strictly
          clearable
          style="width: 220px"
        />
      </el-form-item>
      <el-form-item label="题型" prop="questionType">
        <el-select v-model="queryParams.questionType" placeholder="题型" clearable style="width: 140px">
          <el-option
            v-for="dict in bank_question_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 140px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="题干" prop="content">
        <el-input
          v-model="queryParams.content"
          placeholder="请输入题干关键字"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['bank:question:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['bank:question:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['bank:question:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['bank:question:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Upload"
          @click="handleImport"
          v-hasPermi="['bank:question:import']"
        >导入</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="题目序号" align="center" prop="questionId" width="90" />
      <el-table-column label="题干" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="categoryName" width="120">
        <template #default="scope">
          <span>{{ scope.row.categoryName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="题型" align="center" prop="questionType" width="80">
        <template #default="scope">
          <dict-tag :options="bank_question_type" :value="String(scope.row.questionType)" />
        </template>
      </el-table-column>
      <el-table-column label="难度" align="center" prop="difficulty" width="80">
        <template #default="scope">
          <span>{{ difficultyLabel(scope.row.difficulty) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上架" align="center" prop="status" width="80">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['bank:question:edit']"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['bank:question:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['bank:question:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改题目对话框 -->
    <el-dialog :title="title" v-model="open" width="820px" append-to-body>
      <el-form ref="questionRef" :model="form" :rules="rules" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-tree-select
                v-model="form.categoryId"
                :data="categoryOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                value-key="id"
                placeholder="请选择叶子分类（题目只能挂叶子）"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题型" prop="questionType">
              <el-radio-group v-model="form.questionType" @change="handleTypeChange">
                <el-radio
                  v-for="dict in bank_question_type"
                  :key="dict.value"
                  :value="Number(dict.value)"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="题干" prop="content">
              <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入题干" maxlength="1000" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              v-for="(opt, index) in optionsList"
              :key="opt.key"
              :label="'选项' + opt.key"
            >
              <div class="option-row">
                <el-input v-model="opt.text" :placeholder="'请输入选项' + opt.key + '内容'" />
                <el-button
                  link
                  type="danger"
                  icon="Delete"
                  :disabled="optionsList.length <= 2"
                  @click="removeOption(index)"
                >删除</el-button>
              </div>
            </el-form-item>
            <el-form-item label=" ">
              <el-button
                type="primary"
                plain
                icon="Plus"
                size="small"
                :disabled="optionsList.length >= 6"
                @click="addOption"
              >添加选项（{{ optionsList.length }}/6）</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="正确答案" prop="answer">
              <el-radio-group v-if="form.questionType === 1" v-model="form.answer">
                <el-radio v-for="opt in optionsList" :key="opt.key" :value="opt.key">{{ opt.key }}</el-radio>
              </el-radio-group>
              <el-checkbox-group v-else v-model="answerList" :min="2">
                <el-checkbox v-for="opt in optionsList" :key="opt.key" :value="opt.key">{{ opt.key }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="答案解析" prop="analysis">
              <el-input v-model="form.analysis" type="textarea" :rows="3" placeholder="请输入答案解析（可为空）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="form.difficulty" style="width: 100%">
                <el-option v-for="(label, d) in difficultyMap" :key="d" :label="label" :value="Number(d)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 题目导入对话框（复用全局 ExcelImportDialog） -->
    <excel-import-dialog
      ref="importQuestionRef"
      title="题目导入"
      width="520px"
      action="/bank/question/importData"
      template-action="/bank/question/importTemplate"
      template-file-name="question_template"
      update-support-label="是否更新已经存在的题目（按「分类+题干」判重）"
      @success="getList"
    >
      <template #description>
        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
          <template #title>
            <div class="import-tip">
              列顺序：分类ID、分类路径、题型、题干、选项A~F、正确答案、解析、难度、状态。<br />
              分类ID 与分类路径二选一（路径如「考研政治/马原」）；题型填 单选/多选（也可填 1/2）；
              选项须从 A 开始连续填写；多选答案连写（如 ABD）；难度填 简单/较易/中等/较难/困难，
              状态填 上架/下架，留空分别默认中等与上架。<br />
              任一行校验不通过时整批不导入，并按 Excel 行号列出全部问题。
            </div>
          </template>
        </el-alert>
      </template>
    </excel-import-dialog>
  </div>
</template>

<script setup name="Question">
import { listQuestion, getQuestion, addQuestion, updateQuestion, changeQuestionStatus, delQuestion } from "@/api/bank/question"
import { categoryTreeSelect } from "@/api/bank/category"
import ExcelImportDialog from "@/components/ExcelImportDialog"

const { proxy } = getCurrentInstance()
const { bank_question_type } = useDict("bank_question_type")

const questionList = ref([])
const categoryOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

/** 导入弹窗（复用 ExcelImportDialog，通过 ref.open() 打开） */
const importQuestionRef = ref()

/** 选项行列表（提交时转成 {"A":"...","B":"..."} JSON，回显时反向解析） */
const optionsList = ref([])

/** 多选答案（checkbox 绑定数组，提交时归一化为字母升序字符串） */
const answerList = ref([])

/** 难度标签（与主应用保持一致） */
const difficultyMap = { 1: "简单", 2: "较易", 3: "中等", 4: "较难", 5: "困难" }
function difficultyLabel(d) {
  return difficultyMap[d] || "-"
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryId: undefined,
    questionType: undefined,
    status: undefined,
    content: undefined
  },
  rules: {
    categoryId: [{ required: true, message: "所属分类不能为空", trigger: "change" }],
    questionType: [{ required: true, message: "题型不能为空", trigger: "change" }],
    content: [{ required: true, message: "题干不能为空", trigger: "blur" }],
    answer: [{ required: true, message: "正确答案不能为空", trigger: "change" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询题目列表 */
function getList() {
  loading.value = true
  listQuestion(queryParams.value).then(response => {
    questionList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 查询分类下拉树 */
function getTreeselect() {
  categoryTreeSelect().then(response => {
    categoryOptions.value = response.data
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    questionId: undefined,
    categoryId: undefined,
    questionType: 1,
    content: undefined,
    options: undefined,
    answer: undefined,
    analysis: undefined,
    difficulty: 3,
    status: 1
  }
  optionsList.value = defaultOptions()
  answerList.value = []
  proxy.resetForm("questionRef")
}

/** 默认 A/B/C/D 四个空选项 */
function defaultOptions() {
  return ["A", "B", "C", "D"].map(key => ({ key, text: "" }))
}

/** 题型切换时清空答案，避免残留多选答案提交成单选 */
function handleTypeChange() {
  if (form.value.questionType === 1) {
    form.value.answer = undefined
  } else {
    answerList.value = []
    form.value.answer = undefined
  }
}

/** 添加选项（字母按序自动分配，最多 6 个 A~F） */
function addOption() {
  const letters = "ABCDEF"
  if (optionsList.value.length >= 6) return
  const next = letters.charAt(optionsList.value.length)
  optionsList.value.push({ key: next, text: "" })
}

/** 删除选项；被删选项如出现在答案里则剔除 */
function removeOption(index) {
  if (optionsList.value.length <= 2) return
  const removed = optionsList.value[index].key
  optionsList.value.splice(index, 1)
  if (form.value.questionType === 1) {
    if (form.value.answer === removed) form.value.answer = undefined
  } else {
    answerList.value = answerList.value.filter(k => k !== removed)
  }
}

/** 多选答案 checkbox 变化时同步到 form.answer（字母升序） */
watch(answerList, (val) => {
  if (form.value.questionType !== 1) {
    form.value.answer = [...val].sort().join("")
  }
})

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.questionId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  getTreeselect()
  open.value = true
  title.value = "添加题目"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  getTreeselect()
  const questionId = row.questionId || ids.value
  getQuestion(questionId).then(response => {
    form.value = response.data
    // options JSON 反解析成选项行列表（按键名升序）
    const opts = response.data.options ? JSON.parse(response.data.options) : {}
    optionsList.value = Object.keys(opts).sort().map(key => ({ key, text: opts[key] }))
    // 答案拆成 checkbox 数组
    answerList.value = (response.data.answer || "").split("")
    if (form.value.questionType === 1) answerList.value = []
    open.value = true
    title.value = "修改题目"
  })
}

/** 行内上架/下架开关 */
function handleStatusChange(row) {
  const text = row.status === 1 ? "上架" : "下架"
  proxy.$modal.confirm('确认要' + text + '题目「' + row.questionId + '」吗？').then(function() {
    return changeQuestionStatus(row.questionId, row.status)
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(function() {
    row.status = row.status === 1 ? 0 : 1
  })
}

/** 提交按钮 */
function submitForm() {
  // 选项行校验：内容不能为空，且组装成 JSON 对象
  for (const opt of optionsList.value) {
    if (!opt.text || !opt.text.trim()) {
      proxy.$modal.msgError("选项" + opt.key + "的内容不能为空")
      return
    }
  }
  const optionsJson = {}
  optionsList.value.forEach(opt => {
    optionsJson[opt.key] = opt.text.trim()
  })
  form.value.options = JSON.stringify(optionsJson)

  proxy.$refs["questionRef"].validate(valid => {
    if (valid) {
      if (form.value.questionId != undefined) {
        updateQuestion(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addQuestion(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const questionIds = row.questionId || ids.value
  proxy.$modal.confirm('是否确认删除题目编号为"' + questionIds + '"的数据项？').then(function() {
    return delQuestion(questionIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("bank/question/export", {
    ...queryParams.value
  }, `question_${new Date().getTime()}.xlsx`)
}

/** 导入按钮操作 */
function handleImport() {
  importQuestionRef.value.open()
}

getList()
getTreeselect()
</script>

<style scoped>
.option-row {
  display: flex;
  width: 100%;
  gap: 8px;
  align-items: center;
}
.option-row .el-input {
  flex: 1;
}
.import-tip {
  font-size: 12px;
  line-height: 1.9;
  font-weight: normal;
}
</style>
