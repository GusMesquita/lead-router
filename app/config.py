from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Default seguro: quem esquecer de definir ENVIRONMENT cai nas regras de
    # produção e o app se recusa a subir mal configurado, em vez de subir aberto.
    environment: Literal["dev", "prod"] = "prod"

    anthropic_api_key: str = ""
    brasilapi_url: str = "https://brasilapi.com.br/api"
    database_url: str = "sqlite+aiosqlite:///./lead_router.db"
    min_score_to_dispatch: int = 0

    # Destino do webhook de saída. Recebe PII do lead, por isso exige https e
    # host explicitamente permitido — ver app/dispatch.py.
    outbound_webhook_url: str = ""
    webhook_allowed_hosts: str = ""
    webhook_signing_secret: str = ""

    # Lista separada por vírgula de chaves aceitas no header X-API-Key.
    # Obrigatória quando environment == "prod" (ver app/auth.py).
    api_keys: str = ""

    # Origens permitidas no CORS. Vazio = nenhuma origem de browser, que é o
    # correto para uma API máquina-a-máquina sem frontend.
    cors_origins: str = ""

    # Teto por minuto, por identidade, nos endpoints caros.
    rate_limit_per_minute: int = 60

    @property
    def api_key_set(self) -> set[str]:
        return {key.strip() for key in self.api_keys.split(",") if key.strip()}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def webhook_allowed_host_set(self) -> set[str]:
        return {h.strip().lower() for h in self.webhook_allowed_hosts.split(",") if h.strip()}


settings = Settings()
