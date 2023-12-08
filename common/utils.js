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
