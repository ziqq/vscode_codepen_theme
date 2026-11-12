#include <cstdio>
#include <cuda_runtime.h>

// CUDA qualifiers, kernel launch syntax, structs, and built-in coordinates.
struct Pixel {
  float red;
  float green;
  float blue;
};

__device__ float clamp_channel(float value) {
  return fminf(1.0f, fmaxf(0.0f, value));
}

__global__ void tint(Pixel* pixels, int count, float accent) {
  const int index = blockIdx.x * blockDim.x + threadIdx.x;
  if (index < count) {
    pixels[index].green = clamp_channel(pixels[index].green + accent);
  }
}

int main() {
  Pixel* device_pixels = nullptr;
  constexpr int count = 64;
  cudaMalloc(&device_pixels, sizeof(Pixel) * count);
  tint<<<1, count>>>(device_pixels, count, 0.25f);
  cudaDeviceSynchronize();
  cudaFree(device_pixels);
  std::printf("rendered %d pixels\n", count);
  return 0;
}
