---
tags: ["TypeScript", "编程"]
blog: true
description: TypeScript 是 JavaScript 的超集，添加了类型系统，提供更好的类型检查和 IDE 支持。
---

# TypeScript 入门指南

TypeScript 是 JavaScript 的超集，添加了类型系统。

## 为什么使用 TypeScript

1. 更好的类型检查
2. 更好的 IDE 支持
3. 更易于维护

```typescript
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
```
