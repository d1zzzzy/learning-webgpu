## 前言

此翻译版本是[凡生](https://github.com/d1zzzzy)根据[WebGPU Shading Language](https://gpuweb.github.io/gpuweb/wgsl)的个人翻译版本，仅供学习交流使用，不得用于商业用途。


## 本文档的更多细节

### 当前版本

[地址](https://github.com/gpuweb/gpuweb/blob/e1ded4a401dbfacfe40dea46f77f81dbbbc7a382/wgsl/index.bs)

### 最近发布的版本

[https://www.w3.org/TR/WGSL/](https://www.w3.org/TR/WGSL/)

### 反馈

[Github](https://github.com/gpuweb/gpuweb/issues/)

## 摘要

Shading language for WebGPU。

## 文档状态

这份规范由[Web社区组织的GPU小组](https://www.w3.org/community/gpu/)发布。它不是W3C标准，也不在W3C标准轨道上。请注意，根据[W3C社区贡献者许可协议（CLA）]
(https://www.w3.org/community/about/agreements/cla/)，有限的选择退出和其他条件适用。了解更多关于[W3C社区和商业团体](http://www.w3.org/community/)的信息。

## 目录

### 1 介绍

#### 1.1 概述

在 WebGPU 中，向 GPU 发送工作单元是通过 GPU 命令的形式实现的。WGSL（WebGPU Shading Language）主要关注两种类型的 GPU 命令：

1. **绘制命令（Draw Command）**：这种命令执行渲染管线（render pipeline），在给定的输入、输出和附加资源的上下文中进行。渲染管线主要用于处理图形渲染任务，如绘制三维场景、处理纹理和颜色等。在这种情况下，WGSL 着色器可能包括顶点着色器、片段着色器等，用于处理图形渲染的各个阶段。

2. **分发命令（Dispatch Command）**：这种命令执行计算管线（compute 
   pipeline），在给定的输入和附加资源的上下文中进行。计算管线专注于执行一般的计算任务，而不是直接处理图形渲染。这些任务可能包括数据并行处理、物理模拟等。在这种情况下，WGSL 着色器是计算着色器，专门用于处理这些类型的计算任务。

在这两种类型的管线中，WGSL 着色器起着至关重要的作用。着色器是小型程序，用于在 GPU 上执行特定的图形或计算操作。通过使用 WGSL 编写的着色器，WebGPU 能够充分利用 GPU 的高并行处理能力来执行复杂的渲染和计算任务。这使得 WGSL 成为开发高效、现代网页图形和计算应用的重要工具。

在 WGSL 程序中，着色器是执行管线中一个着色器阶段的部分。一个着色器包括以下几个部分：

1. **入口点函数**：这是着色器的起始点，管线执行时从这里开始执行着色器代码。

2. **所有被调用函数的传递闭包**：从入口点开始，这个集合包括了所有被调用的函数，无论是用户定义的还是内置的函数。这里提到的“传递闭包”是一个更严格的定义，它包括了所有从入口点函数直接或间接调用的函数。

3. **所有这些函数静态访问的变量和常量集合**：这包括了在着色器中使用的所有变量和常量，它们是着色器执行所需的数据。

4. **用于定义或分析所有这些函数、变量和常量的类型集合**：这涉及到着色器中使用的各种数据类型，包括基本类型、结构体、数组等。

> Note: 入口点不是强制性的：在 WGSL 程序中，虽然不强制要求一定要有入口点函数，但是没有入口点的程序无法执行：尽管可以编写不含入口点的 WGSL 程序，但如果没有定义入口点，这样的程序是无法被 WebGPU API 
> 执行的。这是因为创建 GPUProgrammableStage（GPU 可编程阶段）时需要一个入口点。

执行着色器阶段时，会经过下面的步骤：

1. **计算在模块作用域中声明的常量的值**。

2. **将资源绑定到着色器资源接口中的变量**，使得这些资源的内容在执行期间对着色器可用。

3. **为其他模块作用域变量分配内存**，并用指定的初始值填充这些内存。

4. **如果存在，用着色器阶段的输入填充入口点的形式参数**。

5. **如果存在，将入口点的返回值连接到着色器阶段的输出**。

然后，它调用入口点。

一个 WGSL（WebGPU Shading Language）程序包括：

1. **指令（Directives）**：指定模块级别的行为控制。

2. **函数（Functions）**：指定执行行为。

3. **语句（Statements）**：是声明或可执行行为的单元。

4. **字面量（Literals）**：是纯数学值的文本表示。

5. **常量（Constants）**：为在特定时间计算出的值提供名称。

6. **变量（Variables）**：为存储值的内存提供名称。

7. **表达式（Expressions）**：结合一组值产生结果值。

8. **类型（Types）**：每种类型描述：
	- 一组值。
	- 对支持的表达式的约束。
	- 这些表达式的语义。

9. **属性（Attributes）**：修改对象以指定额外信息，如：
	- 指定入口点的接口。
	- 指定诊断过滤器。

> Note: 当前，一个 WGSL（WebGPU Shading Language）程序由单个 WGSL 模块组成。

WGSL（WebGPU Shading Language）是一种命令式语言：行为被指定为一系列要执行的语句。语句可以：

1. **声明常量或变量**。

2. **修改变量的内容**。

3. **使用结构化编程构造来修改执行顺序**：
	- 选择性执行：if（可选的 else if 和 else 子句）、switch。
	- 循环：loop、while、for。
	- 逃离嵌套执行结构：continue、break、break if。
	- 重构：函数调用和返回。

4. **求值表达式以计算上述行为的一部分的值**。

5. **在着色器创建时检查关于常量表达式的假设**。

WGSL（WebGPU Shading Language）是静态类型的：特定表达式计算出的每个值都有一个特定的类型，这个类型仅通过检查程序源码来确定。

WGSL 拥有描述布尔值和数字（整数和浮点数）的类型。这些类型可以聚合成复合类型（向量、矩阵、数组和结构体）。WGSL 有一些特殊类型（例如原子类型），提供独特的操作。WGSL 描述了可以作为内存视图存储在内存中的类型。WGSL 提供了通常用于渲染的类型，如纹理和采样器。这些类型有关联的内置函数，用以暴露通常由 GPU 硬件提供的图形渲染功能。

WGSL 没有从具体类型到其他类型的隐式转换或提升，但确实提供了从抽象类型到其他类型的隐式转换和提升。将一个值从一个具体的数字或布尔类型转换为另一个类型需要明确的转换、值构造器，或位的重新解释；然而，WGSL 提供了有限的功能来将标量类型提升为向量类型。这也适用于复合类型。

着色器阶段的工作被划分为一个或多个调用，每个调用都执行入口点，但在略微不同的条件下进行。同一着色器阶段中的调用共享对某些变量的访问：

1. **阶段中所有调用共享着色器接口中的资源**。

2. **在计算着色器中，同一工作组中的调用共享工作组地址空间中的变量**。不同工作组中的调用不共享这些变量。

然而，这些调用对不同的着色器阶段输入集合进行操作，包括提供用于区分调用与其同伴的标识值的内置输入。每个调用都有自己独立的内存空间，以私有和函数地址空间中的变量的形式存在。

在一个着色器阶段内的调用是并发执行的，而且通常会并行执行。着色器的编写者负责确保着色器阶段中调用的动态行为：

1. **满足某些原始操作的一致性要求**，包括纹理采样和控制障碍。

2. **协调对共享变量的潜在冲突访问**，以避免数据竞争。

WGSL（WebGPU Shading Language）有时允许给定特性有几种可能的行为。这是一个可移植性风险，因为不同的实现可能会展示不同的行为。WGSL 的设计旨在最小化这类情况，但受到可行性的限制，以及在广泛的设备上实现高性能的目标的制约。

行为要求是实现在处理或执行 WGSL 程序时将执行的动作。它们描述了实现在与程序员的合同中的义务。当这些义务可能不是显而易见的时，规范会明确地陈述它们。

#### 1.2 语法表示法

WGSL（WebGPU Shading Language）的语法语义的约定描述如下：

+ 斜体文本：规则的两侧使用斜体文本表示一个语法规则。
+ 加粗等宽文本：规则右侧用单引号（'）开始和结束的加粗等宽文本表示关键词和令牌。
+ 冒号（:）：在常规文本中，冒号注册一个语法规则。
+ 竖线（|）：在常规文本中，竖线表示选择性的替代。
+ 问号（?）：在常规文本中，问号表示前面的关键词、令牌、规则或组出现零次或一次（是可选的）。
+ 星号（*）：在常规文本中，星号表示前面的关键词、令牌、规则或组出现零次或多次。
+ 加号（+）：在常规文本中，加号表示前面的关键词、令牌、规则或组出现一次或多次。
+ 一对匹配的括号（()）：在常规文本中，一对开放的括号（()）和关闭的括号（()）表示一个元素组。

#### 1.3 数学术语和符号

**角度**

+ 按照惯例，角度以弧度为单位测量。
+ 测量角度的参考射线是从原点（0,0）指向（+∞,0）的射线。
+ 让 θ 代表比较射线和参考射线所夹的角度。当比较射线逆时针移动时，θ 增加。
+ 完整圆中有 2π 弧度。
+ 示例：
  - 角度 0 从原点指向右侧，朝向（1,0）。
  - 角度 2π 从原点指向右侧，朝向（1,0）。
  - 角度 π/4 从原点指向点（1,1）。
  - 角度 π/2 从原点指向点（0,1）。
  - 角度 π 从原点指向点（-1,0）。
  - 角度 (3/2)π 从原点指向点（0,-1）。

**双曲角**是一个无单位的面积，而不是传统意义上的角度。
  - 考虑双曲线 `x^2 - y^2 = 1`，对于 `x > 0`。
  - 让 R 是一条从原点到双曲线上某点 (x, y) 的射线。
  - 让 a 是 R、x 轴和双曲线曲线本身所围成的两倍面积。
  - 当 R 在 x 轴上方时，考虑 a 为正；在下方时，为负。

那么面积 a 就是一个双曲角，其中 x 是 a 的双曲余弦，y 是 a 的双曲正弦：

该**区间**是一组具有下限和上限的连续数字。 根据上下文，它们是整数、浮点数或实数的集合。

+ 闭区间 `[a,b]` 是一组满足 `a ≤ x ≤ b` 的数字集合。
+ 半开区间 `[a,b)` 是一组满足 `a ≤ x < b` 的数字集合。
+ 半开区间 `(a,b]` 是一组满足 `a < x ≤ b` 的数字集合。

**地板表达式**

对于实数 x（包括 +∞ 和 −∞），`⌊x⌋ = k`，其中 k 是唯一的整数使得 `k ≤ x < k+1`。

**天花板表达式**

对于实数 x（包括 +∞ 和 −∞），`⌈x⌉ = k`，其中 k 是唯一的整数使得 `k-1 < x ≤ k`。

**截断函数**

对于实数 x（包括 +∞ 和 −∞），计算最接近 x 的整数，其绝对值小于或等于 x 的绝对值：如果 x ≥ 0，则 `truncate(x) = ⌊x⌋`；如果 x < 0，则 `truncate(x) = ⌈x⌉`。

**向上取整函数**

对于正整数 k 和 n，`roundUp(k, n) = ⌈n ÷ k⌉ × k`。

**矩阵转置**

`c` 列 `r` 行矩阵 `A` 的转置是 `r` 列 `c` 行矩阵 `AT`，通过将 `A` 的行作为 `AT` 的列来复制形成：`transpose(A) = AT`，`transpose(A)i`,`j = Aj`,`i`。
列向量的转置通过将列向量解释为 1 行矩阵来定义。同样，行向量的转置通过将行向量解释为 1 列矩阵来定义。

### 2 WGSL模块


一个 WGSL（WebGPU Shading Language）程序由单个 WGSL 模块组成。

模块是一系列可选指令，其后跟随模块作用域声明和 const_assert 语句。模块组织为：

+ **指令**：指定模块级别的行为控制。

+ **函数**：指定执行行为。

+ **语句**：是声明或可执行行为的单元。

+ **字面量**：是纯数学值的文本表示。

+ **变量**：每个变量为存储值的内存提供一个名称。

+ **常量**：每个常量为在特定时间计算出的值提供一个名称。

+ **表达式**：每个表达式结合一组值产生结果值。

+ **类型**：每种类型描述：
	+ 一组值。
	+ 对支持的表达式的约束。
	+ 这些表达式的语义。

+ **属性**：修改对象以指定额外信息，如：
	+ 指定入口点的接口。
	+ 指定诊断过滤器。

> 翻译单元（translation_unit）：
>
> 由多个全局指令（global_directive）和全局声明（global_decl）组成。

> 全局声明（global_decl）：
>
> 可以是一个分号（;）；
> 
> 或者是一个全局变量声明（global_variable_decl）后跟一个分号（;）；
> 
> 或者是一个全局值声明（global_value_decl）后跟一个分号（;）；
> 
> 或者是一个类型别名声明（type_alias_decl）后跟一个分号（;）；
> 
> 或者是一个结构体声明（struct_decl）；
> 
> 或者是一个函数声明（function_decl）；
> 
> 或者是一个 const_assert 语句（const_assert_statement）后跟一个分号（;）。

#### 2.1 着色器的声明周期


WGSL（WebGPU Shading Language）程序及其包含的着色器的生命周期中有四个关键事件。前两个对应于 WebGPU API 方法，用于准备 WGSL 程序以便执行。最后两个是着色器执行的开始和结束。

这些事件包括：

1. **着色器模块创建**

	+ 当调用 WebGPU 的 createShaderModule() 方法时发生。此时提供 WGSL 程序的源文本。

2. **管线创建**

	+ 当调用 WebGPU 的 createComputePipeline() 方法或 createRenderPipeline() 方法时发生。这些方法使用一个或多个先前创建的着色器模块，以及其他配置信息。

3. **着色器执行开始**

	+ 当向 GPU 发出绘制或分派命令时发生，开始执行管线，并调用着色器阶段入口点函数。

4. **着色器执行结束**

	+ 当着色器中的所有工作完成时发生：
		+ 所有调用终止，

		+ 所有对资源的访问完成，

		+ 如果有的话，输出传递到下游管线阶段。

这些事件之间的顺序由于以下因素而确定:
+ 数据依赖性：着色器执行需要管线，而管线需要着色器模块。

+ 因果关系：着色器必须开始执行，然后才能结束执行。

#### 2.2 错误

WebGPU 实现可能由于两个原因无法处理着色器：

1. **程序错误**：如果着色器不满足 WGSL 或 WebGPU 规范的要求，则会发生程序错误。

2. **未分类错误**：即使满足了所有 WGSL 和 WebGPU 的要求，也可能发生未分类错误。可能的原因包括：
	- 着色器过于复杂，超出了实现的能力范围，但这种超出不容易被规定的限制捕获。简化着色器可能解决这个问题。
	- WebGPU 实现中的缺陷。

在着色器生命周期的三个阶段可能发生处理错误：

1. **着色器创建错误**：在着色器模块创建时可检测到的错误。检测仅依赖于 WGSL 模块的源文本和 createShaderModule API 方法可用的其他信息。本规范中描述程序必须执行的某些事情通常会产生着色器创建错误，如果这些断言被违反的话。

2. **管线创建错误**：在管线创建时可检测到的错误。检测依赖于 WGSL 模块的源文本和特定管线创建 API 方法可用的其他信息。

3. **动态错误**：在着色器执行期间发生的错误。这些错误可能检测到，也可能检测不到。

> 注：例如，数据竞争可能是无法检测的。
> 
> 在编程中，数据竞争发生在多个并发进程或线程尝试同时读取和写入同一数据点，而没有适当的同步机制，导致非确定性或意外的行为。
> 由于这种并发性质，数据竞争可能难以在静态分析或测试中被发现，特别是在复杂的并行计算环境中，如 GPU 着色器执行时。

每个要求都将在最早的机会进行检查。具体来说：

1. **着色器创建错误**：在着色器创建时未能满足可检测的要求时产生。

2. **管线创建错误**：在管线创建时未能满足可检测的要求，但在此之前无法检测时产生。

当上下文不清楚时，本规范会指明未满足特定要求是导致着色器创建错误、管线创建错误还是动态错误。

错误的后果如下：

- 带有着色器创建错误或管线创建错误的 WGSL 模块将不会被纳入管线，因此不会被执行。

- 可检测的错误将触发诊断。

- 如果发生动态错误：
	- 内存访问将限制于：
		- 着色器阶段输入，
		- 着色器阶段输出，
		- 绑定到 WGSL 模块中变量的资源的任何部分，
		- 在 WGSL 模块中声明的其他变量。
	- 否则，程序可能不会按照本规范其余部分描述的那样行为。注意：这些效果可能是非局部的。

#### 2.3 诊断

实现可以在着色器模块创建或管线创建期间生成诊断。诊断是实现为了应用程序开发者的利益而产生的消息。

当满足特定条件时，即触发规则时，将创建或触发诊断。条件在源文本中满足的位置，表现为源文本中的点或范围，称为触发位置。

诊断具有以下属性：

1. **严重性**。
2. **触发规则**。
3. **触发位置**。

诊断的严重性分为以下几种，按从最重要到最不重要的顺序排列：

- **错误（error）**：诊断是一个错误。这对应于着色器创建错误或管线创建错误。

- **警告（warning）**：诊断描述了值得应用开发者关注的异常情况，但不是错误。

- **信息（info）**：诊断描述了值得应用开发者关注的显著条件，但不是错误或警告。

- **关闭（off）**：诊断被禁用。它不会传达给应用程序。

触发规则的名称要么是：

- 一个 diagnostic_name_token，
- 要么是两个由句点 '.'（U+002E）分隔的 diagnostic_name_token。

> 诊断规则名称（diagnostic_rule_name）的定义如下：
>
> - 它可以是一个诊断名称标记（diagnostic_name_token）；
> - 或者是两个诊断名称标记（diagnostic_name_token），由一个句点 `'.'` 分隔。

##### 2.3.1 诊断处理

触发的诊断将按照以下方式处理：

1. 对于每个诊断 D，找到包含 D 的触发位置并且具有相同触发规则的最小受影响范围的诊断过滤器。

	- 如果存在这样的过滤器，将其应用于 D，更新 D 的严重性。
	- 否则，D 保持不变。

2. 丢弃严重性为 off 的诊断。

3. 如果至少有一个剩余的严重性为 info 的诊断 DI：

	- 可以丢弃具有相同触发规则的其他 info 诊断，只留下原始诊断 DI。

4. 如果至少有一个剩余的严重性为 warning 的诊断 DW：

	- 可以丢弃具有相同触发规则的其他 info 或 warning 诊断，只留下原始诊断 DW。

5. 如果至少有一个剩余的诊断严重性为 error：

	- 可以丢弃其他诊断，包括其他严重性为 error 的诊断。
	- 产生程序错误。
	- 如果诊断是在着色器模块创建时触发的，则错误是着色器创建错误。
	- 如果诊断是在管线创建时触发的，则错误是管线创建错误。

6. 如果在着色器模块创建时处理，剩余的诊断填充 WebGPU GPUCompilationInfo 对象的 messages 成员。

7. 如果在管线创建期间处理，错误诊断会导致在验证 GPUProgrammableStage 时 WebGPU 验证失败。

> 注：规则允许实现在检测到错误时立即停止处理 WGSL 模块。此外，对于特定类型的警告，分析可以在发现第一个警告时停止；对于特定类型的信息诊断，分析可以在第一次出现时停止。WGSL 并未规定执行不同种类分析的顺序，或者在单一分析内的排序。因此，对于同一个 WGSL 模块，不同的实现可能会报告同一严重性等级的不同诊断实例。

##### 2.3.2 可过滤的触发规则

大多数诊断会无条件地报告给 WebGPU 应用程序。某些类型的诊断可以通过命名其触发规则来进行过滤。以下表格列出了可以过滤的标准触发规则集合。

| 可过滤的触发规则                | 默认严重性 | 触发位置                                                                                                                                        | 描述                                                                                                                                                         |
|-------------------------|-------|---------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `derivative_uniformity` | error | 任何计算导数的内置函数的调用位置。即以下任一函数的调用位置: <p>WGSL 内置函数</p><ul><li>`textureSample`</li><li>`textureSampleBias`</li><li>`textureSampleCompare`</li></ul> | A call to a builtin function computes derivatives, but uniformity analysis cannot prove that the call occurs in uniform control flow. See §14.2 Uniformity |

使用一个未被识别的由单个诊断名称标记组成的触发规则应该会触发用户代理发出警告。

实现可能支持此处未指定的触发规则，前提是它们使用多标记形式的 diagnostic_rule_name 拼写。使用以多标记形式拼写的未被识别的触发规则本身可能会触发诊断。

未来版本的规范可能会删除特定的规则或降低其默认严重性（即用一个不那么严重的默认值替换其当前默认值），并且仍然被视为满足向后兼容性。例如，未来版本的 WGSL 可能会将 derivative_uniformity 的默认严重性从错误更改为警告或信息。在规范发生此类变化后，先前有效的程序将保持有效。

##### 2.3.3 诊断过滤

一旦触发了具有可过滤触发规则的诊断，WGSL 提供了机制来丢弃诊断或修改其严重性。

**诊断过滤器** DF 有三个参数：

+ AR：被称为受影响范围的源文本范围

+ NS：新的严重性

+ TR：触发规则

将诊断过滤器 DF(AR,NS,TR) 应用于诊断 D 有以下效果：

+ 如果 D 的触发位置在 AR 中，并且 D 的触发规则是 TR，则将 D 的严重性属性设置为 NS。

+ 否则，D 保持不变。

**范围诊断过滤器**是其受影响范围为指定源文本范围的诊断过滤器。范围诊断过滤器作为受影响源范围开始处的 @diagnostic 属性指定，如下表所示。@diagnostic 属性不得出现在其他任何地方。

| 放置位置               | 受影 响范围                                             | 
|--------------------|----------------------------------------------------|
| 复合语句的开始            | 复合语句。                                              |
| 函数声明的开始            | 函数声明。                                              |
| if 语句的开始           | if 语句：if 子句和所有相关的 else_if 子句与 else 子句，包括所有控制条件表达式。 |
| switch 语句的开始       | switch 语句：选择器表达式和 switch 主体。                       |
| switch 主体的开始       | switch 主体。                                         |
| 循环语句的开始            | 循环语句。                                              |
| while 语句的开始        | while 语句：条件表达式和循环主体。                               |
| for 语句的开始          | for 语句：for 头部和循环主体。                                |
| 在循环主体的开括号 ('{') 之前 | 循环主体。                                              |
| 连续复合语句的开始          | 连续复合语句。                                            |

> 注：以下也是复合语句：函数体、case 子句、单独的 default 子句、while 和 for 循环的主体，以及 if_clause、else_if_clause 和 else_clause 的主体。

```
// 示例：对纹理采样的范围诊断过滤器

var<private> d: f32;
fn helper() -> vec4<f32> {
  // Disable the derivative_uniformity diagnostic in the
  // body of the "if".
  if (d < 0.5) @diagnostic(off,derivative_uniformity) {
    return textureSample(t,s,vec2(0,0));
  }
  return vec4(0.0);
}
```
```
// 示例：导数一致性的全局诊断过滤器

diagnostic(off,derivative_uniformity);
var<private> d: f32;
fn helper() -> vec4<f32> {
  if (d < 0.5) {
    // The derivative_uniformity diagnostic is disabled here
    // by the global diagnostic filter.
    return textureSample(t,s,vec2(0,0));
  } else {
    // The derivative_uniformity diagnostic is set to 'warning' severity.
    @diagnostic(warning,derivative_uniformity) {
      return textureSample(t,s,vec2(0,0));
    }
  }
  return vec4(0.0);
}
```
全局诊断过滤器可以用来对整个 WGSL 模块应用诊断过滤器。

当以下条件满足时，两个诊断过滤器 DF(AR1,NS1,TR1) 和 DF(AR2,NS2,TR2) 会发生冲突：

+ (AR1 = AR2)，
+ (TR1 = TR2)，
+ (NS1 ≠ NS2)。

诊断过滤器不得冲突。

WGSL 的诊断过滤器设计得其受影响的范围可以完美嵌套。如果 DF1 的受影响范围与 DF2 的受影响范围重叠，则要么 DF1 的受影响范围完全包含在 DF2 的受影响范围内，要么反之。

如果存在，对于源位置 L 和触发规则 TR，最近的封闭诊断过滤器是诊断过滤器 DF(AR,NS,TR)，其中：

+ L 落在受影响范围 AR 内，并且
+ 如果存在另一个过滤器 DF'(AR',NS',TR)，L 落在 AR' 内，则 AR 包含在 AR' 内。

因为受影响的范围是嵌套的，最近的封闭诊断是唯一的，或者不存在。

#### 2.4 限制

WGSL 实现将支持满足以下限制的着色器。WGSL 实现可能支持超出指定限制的着色器。

> 注：如果 WGSL 实现不支持超出指定限制的着色器，它应该发出错误。

| 限制                                                                                            | 最小支持值 |
|-----------------------------------------------------------------------------------------------|-------|
| 结构类型成员的最大数量                                                                                   | 16383 |
| 复合类型的最大嵌套深度                                                                                   | 255   |
| 函数中大括号闭合语句的最大嵌套深度                                                                             | 127   |
| 函数参数的最大数量                                                                                     | 255   |
| switch 语句中 case 选择器的最大数量                                                                      | 16383 |
| 在函数或私有地址空间中实例化的数组类型的最大字节大小                                                                    | 65535 |
| 对于此限制，bool 类型的大小为 1 字节。                                                                       |
| 在工作组地址空间中实例化的数组类型的最大字节大小<br><br><small>注：尽管单个工作组变量可以满足这个限制，但多个这样的变量合在一起仍然可能超出 API 限制。</small> | 16384 |
| 对于此限制，bool 类型的大小为 1 字节，并且在替换覆盖值时，数组被视为固定占用空间的数组。                                              |
| 这将 WebGPU maxComputeWorkgroupStorageSize 限制映射为独立的 WGSL 限制。                                    |
| 数组类型的 const-expression 中元素的最大数量                                                               | 65535 |


### 3 文本结构

#### 3.1 解析

#### 3.2 空格与换行

#### 3.3 注释

#### 3.4 Tokens

#### 3.5 字面量

##### 3.5.1 布尔字面量

##### 3.5.2 数字字面量

#### 3.6 关键字

#### 3.7 标识符

##### 3.7.1 标识符比较

#### 3.8 上下文依赖的名称

#### 3.9 诊断规则名称

#### 3.10 模板列表

### 4 指令

#### 4.1 扩展

##### 4.1.1 开启扩展

##### 4.1.2 语言扩展

#### 4.2 全局诊断过滤

### 5 声明与范围
### 6 类型
### 7 变量与值声明
### 8 表达式
### 9 语句
### 10 函数
### 11 属性
### 12 入口
### 13 内存
### 14 执行
### 15 关键字与Token的总览
### 16 内置函数
### 17 递归下降语法分析