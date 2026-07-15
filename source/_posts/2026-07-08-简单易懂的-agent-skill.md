---
title: 用 Skill 给 Claude Code 装上"肌肉记忆"
date: 2026-07-08 16:30:15
categories:
- 文章
tags:
- AI
- Claude
- skill
---

## skill 介绍

先对齐一个认知：**skill 不是 prompt 模板，也不是命令行脚本，它是一段"按需加载的规程"。**

平时我们把规范、流程塞进 `CLAUDE.md`，结果每次对话都带着一坨上下文跑。skill 的关键区别在于——

- `CLAUDE.md`：**常驻**上下文，每次都在
- skill：**描述**常驻（很便宜），**正文**只在被触发时才进上下文

一句话总结：**你反复粘贴同一段指令/检查清单/多步流程时，就该把它写成 skill 了。**

官方原话也印证这点：

> Create a skill when you keep pasting the same instructions, checklist, or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact.

### skill 和 CLAUDE.md 的关系

| 形态 | 何时加载 | 适合放什么 |
| :-- | :-- | :-- |
| `CLAUDE.md` | **常驻**上下文 | 事实、约定（facts） |
| `.claude/skills/*/SKILL.md` | 描述常驻，**正文按需加载** | 规程、流程、多步任务 |

一句话区分：**`CLAUDE.md` 放"是什么"，skill 放"怎么做"**。当 CLAUDE.md 里某一节开始"像流程而不是事实"了，就说明它该被抽成 skill。

### 谁能触发它

```
              你敲 /skill-name        模型自己判断该用
                   │                        │
                   ▼                        ▼
        (user-invocable)            (disable-model-invocation)
            默认 true                     默认 false
```

两个开关组合出三种策略：

| `disable-model-invocation` | `user-invocable` | 效果 | 例子 |
| :-- | :-- | :-- | :-- |
| false（默认） | true（默认） | 你和模型都能触发 | `summarize-changes` |
| **true** | true | 只能你手动触发，模型不会自作主张 | `deploy` / `commit` |
| false | **false** | 模型自动用，`/` 菜单里看不到 | 老系统的背景知识 |

> 经验：有副作用、有外发动作的（部署、发消息、提交）一律 `disable-model-invocation: true`，别让模型看代码"觉得差不多了"就帮你上线。

---

## 路径结构

skill 的"命令名"完全由**它放在哪**决定，而不是 frontmatter 里的 `name`（`name` 只是显示名）。

### 三级作用域

| 位置 | 路径 | 谁能用 |
| :-- | :-- | :-- |
| 个人级 | `~/.claude/skills/<name>/SKILL.md` | 你的所有项目 |
| 项目级 | `.claude/skills/<name>/SKILL.md` | 仅本项目 |
| 插件级 | `<plugin>/skills/<name>/SKILL.md` | 启用该插件处 |

### 一个 skill 目录长什么样

以 skill-creator 的标准约定为准——一个 `SKILL.md` 入口 + 三个可选的资源目录，各有职责：

```
my-skill/
├── SKILL.md           # 入口，必需（概览 + 导航）
└── （按需的附属资源）
    ├── scripts/       # 可执行代码（确定性/重复任务）
    │   └── validate.sh
    ├── references/    # 按需加载进上下文的文档
    │   └── api.md
    └── assets/        # 输出用的文件（模板、图标、字体）
        └── template.md
```

| 目录 | 装什么 | 怎么用 |
| :-- | :-- | :-- |
| `scripts/` | 确定性、可重复的脚本 | 执行，不进上下文（用 `${CLAUDE_SKILL_DIR}/scripts/xxx` 引用） |
| `references/` | 完整 API、详细参考 | 按需读进上下文 |
| `assets/` | 模板、图标、字体等 | 输出时引用 |

关键原则：**`SKILL.md` 只放概览和导航，大段参考材料拆到 `references/`**。官方建议 `SKILL.md` 控制在 **500 行以内**，大参考文件（>300 行）内部加目录。

> ⚠️ 附属文件不会自动进上下文，要在 `SKILL.md` 里引用它，并写清"什么时候该去读它"，模型才会按需加载。多领域变体时按域拆文件（如 `references/aws.md` / `gcp.md` / `azure.md`），模型只读相关那一份。

### 命令名从哪来

| skill 位置 | 命令名来源 | 例 |
| :-- | :-- | :-- |
| `~/.claude/skills/` 或项目 `.claude/skills/` 下 | **目录名** | `skills/deploy-staging/` → `/deploy-staging` |
| 嵌套且重名 | 子目录路径 + 目录名 | `apps/web/.claude/skills/deploy/` → `/apps/web:deploy` |
| 插件 | 插件名:目录名 | `my-plugin/skills/review/` → `/my-plugin:review` |

> 易错点：改 frontmatter 的 `name` 字段**不会**改变你敲的命令名（插件根目录是唯一例外）。

---

## yaml header 字段

`SKILL.md` 顶部用 `---` 包裹的 YAML frontmatter，核心就两个字段：

```yaml
---
name: my-skill
description: 这个 skill 做什么、什么时候用
---
```

### `name` —— 显示名

列表里展示的名字。**默认取目录名**，所以一般不用写——你敲的命令名由目录决定，不是由 `name` 决定。

### `description` —— 命中的关键

**模型判断"要不要用这个 skill"的唯一依据**。强烈推荐写，不写就用正文第一段顶上，但那样命中率不可控。

写法上，skill-creator 给了两个明确指引：

1. **要稍微"pushy"一点**——Claude 倾向于 **undertrigger**（该用而不用）。所以别写得太谦虚，要主动覆盖各种触发场景：

   > ❌ "How to build a simple fast dashboard to display internal data."
   >
   > ✅ "How to build a simple fast dashboard to display internal data. **Use this whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'**"

2. **what + when 都放进来**——所有"何时使用"的信息都进 description，不放进正文 body。

> 关于 description 命中优化的完整机制（列表字符预算、1536 上限、`run_loop` 自动调优），见后面「description 命中优化」一节。

---

## 内容

> 简介内容该如何写

正文（body）的写法，核心是两条：**说要做什么，并解释为什么。**

官方 skill-creator 的原话很明确——"explain the why behind everything you're asking the model to do"，并告诫：**当你忍不住想写 `ALWAYS` / `NEVER` 这种大写死板结构时，这是黄牌警告**，更好的做法是把理由讲清楚，让模型理解这件事为什么重要。今天的模型很聪明，给它"为什么"比给它"铁律"更有力、也更通用。

另一面，正文一旦被触发，会**常驻整个会话的上下文**，每一行都是反复出现的 token 成本。所以原则是：**精简但不偷懒**——删掉没起作用的废话，但别为了短而砍掉解释 why 的部分。

### 两种正文形态

**参考型（Reference）** —— 注入知识，inline 跑，和对话上下文一起用：

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---
写 API 时：
- RESTful 命名
- 统一错误格式
- 入参校验
```

**任务型（Task）** —— 一步步动作，通常手动 `/触发`：

```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---
部署流程：
1. 跑测试
2. 构建
3. 推到部署目标
```

### 正文 checklist

- ✅ 写"做什么"，并**讲清为什么**——给模型理由，胜过堆 `MUST` / `ALWAYS`
- ✅ 大段参考材料拆到附属文件，主文件只放导航
- ✅ 指令写成**持续生效**的陈述，而不是"一次性步骤"（模型不会每轮重读 skill 文件）
- ✅ 想要更深推理，正文里任意位置写 `ultrathink`
- ❌ 别用大写死板结构（`ALWAYS`/`NEVER`）——这是黄牌，改成讲理
- ❌ 别塞无助于结果的废话，但别为短而砍掉 why
- ❌ 别依赖"第一轮生效后续失效"——内容其实在，是模型选择了别的工具；想强约束用 **hooks** 而不是更长的 prompt

---

## 来源

skill 的内容从哪来？团队里基本是这三条线：

### 业务文档

把团队 wiki / 设计文档里"反复要遵守的规程"沉淀成 skill。例如埋点规范、发布 checklist、代码评审标准。

- 优势：**事实型材料，正中 skill 的靶心**
- 注意：文档会更新，skill 要跟着维护；可以把权威文档作为附属文件引用，正文只放稳定部分

### 基础库

某个 SDK / 内部库的使用范式、踩坑清单、最佳实践。

```text
sdk-best-practice/
├── SKILL.md          # 核心范式 + 何时读 references
└── references/
    └── api.md       # 完整 API
```

- 配合 `paths: **/*.sdk相关文件` 让它只在编辑相关文件时自动激活，避免污染无关对话

### 会话提炼

最有价值的一条线：**某次对话里反复粘贴、调试好的 prompt，提炼成 skill。**

典型信号：
- 你这周已经第三次粘同一段指令
- 一段 prompt 越调越长，但每次都得手动带
- CLAUDE.md 里有一节开始"像流程而不是事实"了

> 官方原话正是在描述这个场景。会话提炼是 skill 最大的日常价值来源——把"调好的肌肉记忆"固化下来，下次自动复用。

---

## skill-creator 如何用 AI 自己写 skill

官方提供了 `skill-creator` 插件，能让你**用 AI 写 skill、用 AI 评 skill**。

### 安装

```text
/plugin install skill-creator@claude-plugins-official
```

装完 `/reload-plugins`，然后：

```text
evaluate my summarize-changes skill with skill-creator
```

### 它能帮你做什么（官方实际流程）

```
 ① 起草 skill
      │
 ② 写 2~3 个真实测试 prompt ──► evals/evals.json
      │                          （这步只写 prompt，先不写断言）
      │
 ③ 同一轮里把所有 run 一起起 ──► 每个用例起「两个」subagent：
      │                          with_skill  +  baseline
      │                          ┌─ 新建 skill：baseline = 无 skill
      │                          └─ 改进 skill：baseline = 旧版本快照
      │
 ④ 趁 run 在跑，起草断言 ──► 断言要客观可判、命名清晰；
      │                     主观类 skill（文风、设计）跳过断言，走人工评审
      │
 ⑤ 每个 run 完成时立即记 timing.json（total_tokens / duration_ms）
      │                     —— 这数据只在任务通知里出现一次，别攒着批处理
      │
 ⑥ 打分 ──► grading.json（字段固定为 text / passed / evidence）
      │        能脚本判的就写脚本，比肉眼快且可复用
      │
 ⑦ 汇总 ──► python -m scripts.aggregate_benchmark
      │        → benchmark.json + benchmark.md（pass_rate / time / tokens，mean±stddev + delta）
      │
 ⑧ 分析 ──► analyzer：揪出永真断言（无区分度）、高方差用例（flaky）、时间/token 权衡
      │
 ⑨ 评审 ──► generate_review.py 开浏览器：Outputs 标签逐条看 + Benchmark 标签看量化
      │        人工留反馈 → feedback.json（空反馈 = 觉得没问题）
      │
 ⑩ 读反馈 → 改 skill → 新一轮 iteration-N+1 → 循环到满意
      │
 ⑪ （可选）盲测 A/B ──► 给独立 agent 两个不标版本的输出，让它判优劣
      │                    官方：可选，多数人不需要，人工评审通常已够
      │
 ⑫ 描述调优（skill 定稿后单独跑）──► 见「description 命中优化」
```

> ⚠️ 别用 `/skill-test` 之类的测试 skill，skill-creator 自己就是测试工具。

### 用 AI 写 skill 的要点

1. **先给 AI 看真实输入输出样例**，而不是只描述需求——few-shot 比需求描述靠谱
2. 让 AI 起草后，**立刻进 eval 循环**：写 2~3 个真实 prompt 当测试集（先只写 prompt，断言等 run 跑起来再补）
3. **基线要选对**：新建 skill 对照"无 skill"，改进已有 skill 对照"旧版本快照"——不是把 skill 禁用了当基线
4. **靠人工评审 + 量化基准迭代**，直到反馈全空或不再有实质进步就停；盲测 A/B 是可选的加严手段，不是必过门槛
5. description 单独拿出来调——它决定"被不被触发"，和"内容写得好不好"是两件事，分开测、分开改

> 详细格式见 [agentskills.io - evaluating-skills](https://agentskills.io/skill-creation/evaluating-skills)。

---

## 测试-验证集设计

这一节是把上面"skill-creator 怎么用"落到我们团队的执行规范。

### 核心心法：触发 ≠ 有效

> 官方原话：**"Seeing a skill trigger tells you Claude found it, not that it did what you intended."**

所以要**分开测两件事**：

| 测什么 | 怎么测 | 指标 |
| :-- | :-- | :-- |
| **是否被触发** | 准备一批"该触发"的 prompt，新会话里看命中率 | 命中率 |
| **输出是否对** | 触发后，逐条断言核对输出 | 通过率 |

### 为什么必须用新会话

写 skill 时残留的上下文会**掩盖正文的漏洞**——你调 skill 的过程里，模型其实记住了你的意图。换一个干净会话，才知道光靠正文写得够不够。

### 验证集怎么搭

```
evals/
└── evals.json    # 每条 = { prompt, 输入文件, 期望行为/断言 }
```

设计验证集的几条原则：

1. **真实优先**：用团队里真实会问的话，别自己编"理想 prompt"
2. **正负样本都要**：
   - should-trigger：该用这个 skill 的 prompt
   - should-not-trigger：看着像、但不该触发的 prompt（防误触发）
3. **覆盖边界**：空输入、超长输入、参数缺失、多 skill 候选冲突的场景
4. **断言可判定**：期望行为写成"输出包含 X""未调用 Y 工具""格式符合 Z"这类机器能判的，别写"质量好"

### 基线对比流程

```
对每个测试 prompt，同一轮里起两个 subagent：
  ├─ with_skill ──► 跑一次，记录 (输出, token, 耗时)
  └─ baseline   ──► 跑一次，记录 (输出, token, 耗时)
       ├─ 新建 skill：baseline = 无 skill
       └─ 改进 skill：baseline = 旧版本快照（改之前先 cp -r 备份）
        │
        ▼
   对比 benchmark.json：通过率提升 vs token/耗时增加（mean±stddev + delta）
```

> 关键：with_skill 和 baseline 要**同一轮一起起**，别先跑完 with_skill 再回头补 baseline——一起起才能差不多同时拿到结果。baseline 选错（比如把 skill 禁用而非"无 skill / 旧版本"）会让对比失去意义。

### 测试 query 必须够"有分量"

官方点出一个反直觉的点：**模型只对它自己搞不定的任务才会去查 skill**。简单一步任务（如"读一下这个 PDF"）即使 description 完全匹配，也可能不触发——因为模型用基础工具就能搞定。

所以测试 prompt 不能是 `"读文件 X"` 这种过简单的，要**足够具体、有细节、像真人会打的**：

```
❌  "Format this data"  /  "Create a chart"
✅  "我老板发了个 xlsx（downloads 里那个 Q4 sales final FINAL v2.xlsx），
    要我加一列算利润率百分比，收入在 C 列成本在 D 列"
```

带文件路径、背景、列名、口语化、有错别字——这种 query 才会让模型真的"需要"这个 skill。

### 评判产出

- `grading.json`：每条断言的 `text` / `passed` / `evidence`（字段名固定，viewer 依赖它）
- `benchmark.json` + `benchmark.md`：汇总通过率、耗时、token，with_skill vs baseline 对比
- `generate_review.py` 生成的 HTML 评审器：Outputs 标签逐条看输出、Benchmark 标签看量化，人工留反馈写进 `feedback.json`（空反馈 = 觉得没问题）

> 迭代纪律：**靠人工评审 + 量化基准循环**，直到反馈全空或不再有实质进步就停。盲测 A/B（给独立 agent 两个不标版本的输出判优劣）是**可选**的加严手段，多数人不需要，人工评审通常已够。

---

## skill 优化设计

### 内容优化

正文已经能被触发、但输出不够好——这时候优化**内容**。

#### 优化方向

| 现象 | 优化动作 |
| :-- | :-- |
| 输出正确但啰嗦/跑偏 | 正文太长 → 拆附属文件，主文件留导航 |
| 模型没遵循某条指令 | 指令写成**持续生效陈述**而非"第一步…第二步…"；要强约束上 **hooks** |
| 第一轮对、后续失效 | 内容其实在，是模型选了别的路；强化 description + 指令措辞，或压缩后重新触发 |
| 大段参考材料污染上下文 | 移到 `references/`，正文写"需要完整 API 时读 references/xxx.md" |
| 复杂多步任务占太多上下文 | 加 `context: fork` 跑在子代理里，主上下文只看结果 |

#### 写正文的几条硬规矩

1. **说要做什么，并解释为什么**——给模型理由，胜过 `MUST`/`ALWAYS` 大写死板结构
2. **主文件 ≤ 500 行**，超了就拆；大参考文件（>300 行）加目录
3. **指令是 standing instructions**（持续生效），因为模型不会每轮重读文件
4. 附属文件必须在主文件里**被引用并说明何时加载**，否则等于不存在
5. 想要更深思考，正文里任意位置塞 `ultrathink`
6. 别为局部用例加"过拟合"的小修小补——要从模式/隐喻层面泛化，skill 要能服务海量场景

#### 优化循环

```
 跑 eval ──► 看 grading.json + benchmark.json 定位失败用例
    │         （也读 transcript，看模型是否在浪费时间做无用功）
    ▼
 改正文（拆文件 / 讲清 why / 泛化 / 加 hooks）
    │         （留意：多个用例各自重写了相似脚本 → 把它收进 scripts/）
    ▼
 重新跑一轮 iteration-N+1（with_skill + baseline 一起起）
    │
    ▼
 人工评审 feedback.json + 看量化对比
    │
    ├─ 反馈全空 / 不再有实质进步 ──► 定稿
    └─ 还有问题                       ──► 继续改
```

> 盲测 A/B 是可选加严项，不是必过门槛。

---

### description 命中优化

skill 写得再好，**模型没在正确时机触发它，等于白写**。`description` 是命中优化的主战场。

#### 命中机制

模型每轮看到的是一份**"skill 列表"**，里面是各 skill 的 name + description。它就靠这份列表决定"要不要用某个 skill"。

```
┌──────────── 上下文里的 skill 列表（有字符预算）─────────────┐
│ skillA:  <name + description>                            │
│ skillB:  <name + description>   ← 模型据 description 判断 │
│ skillC:  <name + description>                            │
└──────────────────────────────────────────────────────────┘
```

关键限制（也是优化的发力点）：

- 列表有**总字符预算**：约模型上下文窗口的 1%
- 单条 description + when_to_use 合计上限 **1536 字符**
- 预算超了，**从你最少用的 skill 开始砍 description**（name 保留）
- 用 `/doctor` 看列表的上下文成本和大头贡献者；`/context` 的 Skills 行显示预算后实际大小

#### 写 description：要"稍微 pushy 一点"

官方点出一个重要倾向：**Claude 会 undertrigger——该用的时候不用**。所以 description 别写得太谦虚，要主动覆盖各种触发场景：

> ❌ "How to build a simple fast dashboard to display internal Anthropic data."
>
> ✅ "How to build a simple fast dashboard to display internal Anthropic data. **Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'**"

另一个前提：**模型只对它自己搞不定的任务才查 skill**。简单一步任务即便 description 完全匹配也可能不触发——所以 description 里描述的场景要足够"需要 skill"才有意义。

#### 调优 checklist（手动排查）

**该触发却没触发：**

1. description 里有没有用户**自然会说出口**的关键词？（别用你自己才懂的术语）
2. 确认 skill 出现在"What skills are available?"里
3. 用 `--debug` 看 frontmatter 有没有 YAML 解析错误（解析失败会以空元数据加载，`/名`还能用但没有 description 可匹配）
4. 实在不行先 `/skill-name` 手动触发，确认内容没问题再回头调 description

**不该触发却老触发：**

1. 把 description 收窄、加更具体的限定
2. 只想手动触发 → `disable-model-invocation: true`
3. 只在特定文件上触发 → 加 `paths: **/xxx`

**description 被截断：**

1. 把**最关键的使用场景放最前面**（1536 字符上限从前往后算）
2. 低优先级 skill 在 `skillOverrides` 里设 `"name-only"`，省下预算给高频 skill
3. 提高预算：`skillListingBudgetFraction`（如 `0.02`）或环境变量 `SLASH_COMMAND_TOOL_CHAR_BUDGET`

#### 用 skill-creator 自动调优 description（官方流程）

skill 定稿后，用 skill-creator 的 description 优化循环**自动**调命中率：

```
 ① 生成 20 条 trigger eval query
    ├─ should-trigger  8~10 条：覆盖不同说法（正式/口语/不点名 skill）
    └─ should-not-trigger 8~10 条：near-miss——共享关键词但实际需要别的
       （"写个斐波那契"这种明显无关的反例是无效的，太简单不测东西）
    要求：具体、带细节（路径/列名/背景/口语/错别字），别写抽象的
       │
 ② 用 HTML 模板给用户过一遍（assets/eval_review.html），
    用户可改 query、切换 should-trigger、增删条目 → 导出 eval_set.json
       │
 ③ 后台跑优化循环：
    python -m scripts.run_loop \
      --eval-set <trigger-eval.json> \
      --skill-path <skill-path> \
      --model <当前会话模型 id> \   # 要和用户实际体验的模型一致
      --max-iterations 5 --verbose
       │
    机制：60% train / 40% held-out test 划分；
          每条 query 跑 3 次取稳定触发率；
          让 Claude 按失败点提议 description 改动；
          新 description 在 train + test 上都重评；
          最多 5 轮迭代
       │
 ④ 取 best_description —— 按 test 分数选，防过拟合
    （不是按 train 分数）→ 写回 SKILL.md，给用户看 before/after + 分数
```

> 注意：这一步依赖 `claude -p`（CLI），只在 Claude Code 里能跑，Claude.ai 等无 CLI 环境跳过。要等 skill 内容本身改好了再调 description，别两头同时动。

#### 命中优化的闭环

```
 准备 20 条 trigger eval（should / should-not-trigger）
            │
            ▼
   run_loop 自动跑 5 轮，按 test 分数选 best_description
            │
            ▼
   命中率仍不达标 / 误触发高 ──► 手动收窄或补关键词，再跑一轮
```

> 命中和内容是两条独立的线：**description 决定"用不用"，正文决定"用得好不好"**。优化时分开测、分开改，别混在一起。

---

## 如何集成到 agent 框架

前面都在讲"怎么写 skill"，这一节回答另一个问题：**我们自己的 agent 框架，怎么把 skill 装进去？** 面向没做过 agent 的同学，先从最简的 agent 长什么样讲起。

### 先认识一个最简 agent：api → ReAct → loop

抛开各种框架，一个能动手干活的 agent，本质就三块东西：

```
 用户输入
    │
    ▼
┌─────────────────────────────────────────────┐
│  agent loop（一个 while 循环）              │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  ① 调模型 API（带上系统提示 + 历史） │  │
│   └──────────────────────────────────────┘  │
│              │                             │
│              ▼ 模型要么给最终回答，要么要求调工具
│   ┌──────────────────────────────────────┐  │
│   │  ② 执行工具（读文件/跑命令/查接口） │  │
│   └──────────────────────────────────────┘  │
│              │                             │
│              ▼ 把工具结果塞回历史，回到 ①
│                                             │
│   直到模型给出最终回答 → 退出循环           │
└─────────────────────────────────────────────┘
    │
    ▼
 输出给用户
```

- **api**：就是调一次大模型接口（发消息、收回复）
- **ReAct**：模型的回复里可以带"工具调用"，agent 执行工具、把结果喂回模型，模型再决定下一步——这个"思考→行动→观察"的循环叫 ReAct
- **agent loop**：把上面两步套进一个 `while` 循环，直到模型说"我答完了"为止

最小伪代码：

```python
messages = [system_prompt, user_input]

while True:
    reply = call_model_api(messages)          # ① 调 API
    if reply.has_tool_calls:                  # 模型想调工具
        for call in reply.tool_calls:
            result = run_tool(call)           # ② 执行工具
            messages.append(result)           # 把结果塞回历史
    else:
        print(reply.text)                     # 模型答完了，退出
        break
```

理解了这三块，skill 怎么集成就清楚了——**skill 不是新机制，而是往这个循环里塞东西。**

### skill 的注入原理：progressive disclosure

skill 不像 `CLAUDE.md` 那样一开始全塞进上下文。它用**三级按需加载**，这也是 [agentskills.io](https://agentskills.io/client-implementation/adding-skills-support) 定义的核心原则：

| 层级 | 装的是什么 | 何时加载 | 成本 |
| :-- | :-- | :-- | :-- |
| ① 目录 Catalog | 各 skill 的 name + description | **会话开始就常驻** | 每条 ~50–100 token |
| ② 指令 Instructions | 完整 `SKILL.md` 正文 | **被触发时**才进上下文 | 建议 <5000 token |
| ③ 资源 Resources | scripts / references / assets | 正文引用到时**再按需读** | 按实际用量 |

一句话：**目录先告诉模型"有哪些 skill 可用"，模型判断某个相关了，再去加载它的正文；正文里提到某个参考文件，再按需读那一个。**

### 把它接进 agent loop

对应到上面三块 agent，skill 的注入发生在**两个时机**：

```
┌─ 会话开始（loop 之前）───────────────────────────────┐
│  ① 扫描 skill 目录，解析每个 SKILL.md 的 frontmatter │
│  ② 把 [name + description] 拼成 catalog              │
│  ③ catalog 注入 system_prompt（常驻，很便宜）       │
└──────────────────────────────────────────────────────┘
                         │
                         ▼ 进入 agent loop
┌─ 循环中（某轮）──────────────────────────────────────┐
│  模型读 catalog，判断"这个任务该用 skill X"          │
│      │                                               │
│      ▼ 两种激活方式                                   │
│  a) 模型直接用读文件工具读 SKILL.md（最简，要模型能读文件）
│  b) 模型调一个专用 activate_skill 工具（更可控）      │
│      │                                               │
│      ▼ 正文进上下文（tier 2），模型按正文干活         │
│  正文若引用 references/xxx.md → 模型按需再读（tier 3）│
└──────────────────────────────────────────────────────┘
```

接进最小伪代码后是这样：

```python
# —— 会话开始：注入 tier 1（catalog）——
skills = scan_skill_dirs()              # 扫描 + 解析 frontmatter
catalog = build_catalog(skills)        # 只取 name + description
system_prompt += catalog_block(catalog)  # 拼进 system prompt（常驻）

# —— agent loop ——
messages = [system_prompt, user_input]
while True:
    reply = call_model_api(messages)
    if reply.has_tool_calls:
        for call in reply.tool_calls:
            if call.name == "activate_skill":   # tier 2：加载正文
                result = load_skill_body(call.args["name"])
            else:                                # 其它工具（读文件等）
                result = run_tool(call)          # tier 3 也走读文件工具
            messages.append(result)
    else:
        print(reply.text); break
```

### 三个工程要点

集成时最容易踩的三点（不用记细节，知道有这回事即可）：

1. **catalog 要"省着放"**——它是常驻上下文，几十个 skill 也只占几千 token，因为只放 name+description。这也是为什么 description 写得好不好直接决定命中率。

2. **压缩时要保护 skill 正文**——agent 上下文满了会自动裁剪/总结旧消息，**skill 正文要豁免裁剪**，否则模型中途丢了规程却不报错，行为悄悄变差。用结构化标签（如 `<skill_content>` 包住正文）来识别和保护。

3. **项目级 skill 要做信任检查**——项目里的 skill 来自仓库，可能是刚 clone 的开源项目。加载前要确认用户已"信任"该项目，避免不可信仓库悄悄往上下文里塞指令。

> 一句话总结集成原理：**agent loop 还是那个 loop，skill 只是会话开始时往 system prompt 里塞一份"目录"，循环中模型按需把正文加载进上下文。** 没有新机制，只是"按需加载"这一招。

---

### 参考资源

- [Extend Claude with skills（官方文档）](https://code.claude.com/docs/en/skills)
- [Evaluating skill output quality（agentskills.io）](https://agentskills.io/skill-creation/evaluating-skills)
- [skill-creator 公告](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
