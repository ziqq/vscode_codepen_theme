// Constant buffers, semantics, structs, resources, and vector operations.
cbuffer ThemeSettings : register(b0)
{
    float4 AccentColor;
    float Exposure;
    bool UseTwilight;
};

Texture2D<float4> SourceTexture : register(t0);
SamplerState LinearSampler : register(s0);

struct VertexInput
{
    float3 position : POSITION;
    float2 uv : TEXCOORD0;
};

struct VertexOutput
{
    float4 position : SV_POSITION;
    float2 uv : TEXCOORD0;
};

VertexOutput vertex_main(VertexInput input)
{
    VertexOutput output;
    output.position = float4(input.position, 1.0);
    output.uv = input.uv;
    return output;
}

float4 pixel_main(VertexOutput input) : SV_TARGET
{
    float4 source = SourceTexture.Sample(LinearSampler, input.uv);
    return UseTwilight ? saturate(source * Exposure + AccentColor) : source;
}
