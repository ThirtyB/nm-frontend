<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* 全局开关元素自定义样式 */
.el-switch.is-checked .el-switch__core {
  background-color: #ffd700 !important;
  border-color: #ffd700 !important;
}

.el-switch.is-checked .el-switch__core::after {
  background-color: #fff !important;
}

.el-switch__core {
  border-color: #dcdfe6;
}

.el-switch.is-checked .el-switch__action {
  background-color: #fff !important;
}
</style>