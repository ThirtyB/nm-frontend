# 密码验证修复说明

## 问题描述
在编辑用户时，即使密码字段为空，仍然提示"请输入密码"，但应该显示"留空则不修改密码"。

## 修复方案

### 1. 自定义验证器
创建了 `validatePassword` 函数来处理密码验证逻辑：

```javascript
const validatePassword = (rule, value, callback) => {
  // 编辑模式下，密码可以为空
  if (isEdit.value && !value) {
    callback()
    return
  }
  
  // 新建模式下，密码不能为空
  if (!isEdit.value && !value) {
    callback(new Error('请输入密码'))
    return
  }
  
  // 密码长度验证
  if (value && value.length < 6) {
    callback(new Error('密码长度至少6位'))
    return
  }
  
  callback()
}
```

### 2. 验证规则更新
```javascript
const rules = {
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ]
}
```

## 验证逻辑

### 新建用户时：
- 密码不能为空 ✅
- 密码长度至少6位 ✅

### 编辑用户时：
- 密码可以为空（不修改密码）✅
- 如果输入密码，长度至少6位 ✅
- 显示提示"留空则不修改密码" ✅

## 测试步骤

1. 点击"新增用户" - 密码字段必填
2. 点击"编辑用户" - 密码字段可以为空
3. 编辑时输入密码 - 验证长度至少6位
4. 编辑时不输入密码 - 验证通过，不修改密码

修复完成！