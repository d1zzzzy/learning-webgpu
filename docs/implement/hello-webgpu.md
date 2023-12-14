# Hello WebGPU

## 什么是 WebGPU

> WebGPU API 使 web 开发人员能够使用底层系统的 GPU（图形处理器）进行高性能计算并绘制可在浏览器中渲染的复杂图形。
> ——[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGPU_API)

## WebGPU 与 WebGL

> 什么是 WebGPU？
> [WebGPU](https://gpuweb.github.io/gpuweb/) 是一种新的现代 API，用于在 Web 应用中访问 GPU 的功能。

### WebGL

是 [OpenGL ES 2.0](https://registry.khronos.org/OpenGL-Refpages/es2.0/) 图形库的 JavaScript 端口，允许 web 页面直接将渲染计算传递给设备的 GPU，这会以非常高的速度处理，并在 `<canvas>` 内渲染结果。

### WebGPU

`WebGPU API` 使 web 开发人员能够使用底层系统的 GPU（图形处理器）进行高性能计算并绘制可在浏览器中渲染的复杂图形。

**其他参考文章**:

[from-webgl-to-webgpu](https://developer.chrome.com/blog/from-webgl-to-webgpu)

## 从 `Hello-WebGPU` 开始

根据使用 WebGPU 生成一个三角形开启 WebGPU 的学习之路。

### 准备工作

首先我们需要一个 `Canvas` 元素作为绘制载体。

```html
<canvas />
```

> 小知识点: [画布的最大的尺寸](https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element)

需要判断当前环境是否支持 `webgpu`
   + `navigator.gpu` 是否存在
   + `navigator.gpu.requestAdapter()` 是否存在

```javascript
// 抽出一个方法 getDevice
// 如果抛出异常则不支持 webgpu
async function getDevice() {
	if (!navigator.gpu) {
		throw new Error('WebGPU not supported');
	}

	const gpu = navigator.gpu;
	const adapter = await gpu.requestAdapter();

	if (!adapter) {
		throw new Error('No adapter found');
	}

	return adapter.requestDevice();
}
```

创建画布以及基础配置。

```javascript
const canvas = document.querySelector('canvas');
// 参考 https://gpuweb.github.io/gpuweb/#canvas-rendering
const context = canvas.getContext('webgpu');

// [getPreferredCanvasFormat](https://developer.mozilla.org/zh-CN/docs/Web/API/GPU/getPreferredCanvasFormat) 方法
// 返回用于当前系统上显示 8 位色深、标准动态范围（SDR）内容的最佳 canvas 纹理格式。
// 如果你没有在配置 canvas 上下文时使用最佳的格式，可能会产生开销，例如根据平台而异的额外纹理的复制。
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
	device,
	format: presentationFormat,
});
```

需要注意的是这里的 `context` 是 [GPUCanvasContext](https://developer.mozilla.org/zh-CN/docs/Web/API/GPUCanvasContext)，并且通过 
[configure](https://developer.mozilla.org/zh-CN/docs/Web/API/GPUCanvasContext/configure) 方法使用给定的 `GPUDevice` 配置渲染上下文并清除 `canvas` 为透明的黑色。

### Shader

在设置完画布之后，接下来就是 `shader` 的编写:

```javascript
const module = device.createShaderModule({
  label: 'my-shader',
    code: `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex: u32,
      ) -> @builtin(position) vec4f {
        let pos = array(
					vec2f(-0.5,  0.5),
					vec2f( 0.5,  0.5),
					vec2f(-0.5, -0.5),

					vec2f( 0.5, -0.5),
					vec2f( -0.5, 0.5),
					vec2f( 0.5,  0.5),
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `
});
```

这段代码会根据 `code` 当中 [WGSL](https://gpuweb.github.io/gpuweb/wgsl/) 语法的代码创建 [GPUShaderModule](https://developer.mozilla.org/en-US/docs/Web/API/GPUShaderModule)。

`@vertex` 代表创建**顶点着色器**，`@fragment` 代表创建的是**片段着色器**。这里 `pos` 变量创建了6个顶点，也就是两个互为镜像的三角形。`@builtin`和`@location`是 `WGSL` 
中的修饰符。

后续需要通过 `GPUDevice` 的 [createRenderPipeline](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createRenderPipeline) 方法来控制顶点和片段着色器阶段并在 `GPURenderPassEncoder` 或 `GPURenderBundleEncoder` 中使用。

### 绘制

```javascript
const pipeline = device.createRenderPipeline({
	label: 'my-pipeline',
	layout: 'auto',

	// 顶点着色器
	// 定义的是顶点着色器从 module 中的 vs 方法获取
	vertex: {
		module,
		entryPoint: 'vs',
	},

	// 片段着色器
	// 定义的是顶点着色器从 module 中的 fs 方法获取
	// 并且通过 `targets > [format](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createRenderPipeline#format_2)` 指定输出颜色所需格式的枚举值。
	fragment: {
		module,
		entryPoint: 'fs',
		targets: [
			{
				format: presentationFormat,
			},
		],
	}
});
```

再通过 `GPUDevice` 接口的 `createCommandEncoder()` 方法创建一个 `GPUCommandEncoder`，用于对要发送到 GPU 的命令进行编码。

```javascript
const encoder = device.createCommandEncoder({ label: 'my encoder' });

// [Color attachment object structure](https://developer.mozilla.org/en-US/docs/Web/API/GPUCommandEncoder/beginRenderPass#color_attachment_object_structure)
const renderPassDescriptor = {
	colorAttachments: [
		{
			// view: <- to be filled out when we render
			// clearValue view在执行渲染通道之前清除纹理的颜色值。loadOp如果未设置为 ，则忽略该值"clear"。clearValue接受一个数组或对象，将四个颜色分量r、g、b和表示a为小数。
			clearValue: [0.0, 0.5, 1.0, 1.0],
			// loadOp
			// view一个枚举值，指示在执行渲染通道之前要执行的加载操作。可能的值为：
			// 		"clear"：clearValue将此附件加载到渲染通道中。
			// 		"load"：将此附件的现有值加载到渲染通道中
			loadOp: 'clear',
			// storeOp
			// view一个枚举值，指示执行渲染通道后要执行的存储操作。可能的值为：
			//
			// 		"discard"：丢弃此附件的渲染通道的结果值。
			// 		"store"：存储此附件的渲染通道的结果值。
			storeOp: 'store',
		},
	],
};

// 一个 GPUTextureView 对象，表示将输出到此颜色附件的纹理子资源。
renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

// 开始对渲染通道进行编码
const pass = encoder.beginRenderPass(renderPassDescriptor);
```

`beginRenderPass` 返回可用于控制渲染的 `GPURenderPassEncoder`。后续通过这个 `setPipeline` 设置对应的管道以及 `draw` 方法根据 `setVertexBuffer() `
提供的顶点缓冲区绘制图元。

```javascript
	// 开始对渲染通道进行编码
  const pass = encoder.beginRenderPass(renderPassDescriptor);
	// 用于此渲染通道的
  pass.setPipeline(pipeline);
	// 根据 提供的顶点缓冲区绘制图元
	// 但是这里设置的是绘制三个顶点，所以只会绘制一个三角形
	// 如果把 3 改成 6 则会绘制两个镜像且相交的三角形
  pass.draw(3);
  pass.end();

	// 完成对该GPUCommandEncoder上编码的命令序列的记录，返回对应的GPUCommandBuffer。
  const commandBuffer = encoder.finish();
	// 调度 GPU 执行由一个或多个 GPUCommandBuffer 对象表示的命令缓冲区。
  device.queue.submit([commandBuffer]);
```

至此，算是编写完了 `WebGPU` 的 `hello world`。当中很多新的内容（新对象、属性、方法），需要在后续的学习中不断理解掌握。
