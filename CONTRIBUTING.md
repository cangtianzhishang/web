# GitHub 工作流规范

## 分支策略
- `main`: 生产分支，仅接受通过 PR 合并。
- `develop`: 日常集成分支。
- `feature/*`: 功能分支，完成后提 PR 到 `develop`。
- `hotfix/*`: 紧急修复，提 PR 到 `main` 和 `develop`。

## 提交规范
建议采用 Conventional Commits：
- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档修改
- `refactor:` 重构

## Pull Request 要求
- 描述业务背景、变更点、测试结果。
- 至少 1 个 reviewer。
- CI 通过才可合并。
