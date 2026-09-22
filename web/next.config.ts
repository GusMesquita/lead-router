import type { NextConfig } from "next"

// Headers que o browser só respeita se vierem na resposta — e este app é a
// janela de um backend que recebe PII de lead.
const securityHeaders = [
  // Sem enquadramento: o dashboard não é para ser embutido em lugar nenhum.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nenhum referrer para fora: a URL pode carregar o id do lead.
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
]

const nextConfig: NextConfig = {
  // Anunciar a versão do framework só ajuda quem procura alvo por versão.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
