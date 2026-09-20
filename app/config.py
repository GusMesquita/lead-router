from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    brasilapi_url: str = "https://brasilapi.com.br/api"
    outbound_webhook_url: str = ""
    min_score_to_dispatch: int = 0
    database_url: str = "sqlite+aiosqlite:///./lead_router.db"

    # Comma-separated list of accepted API keys for service-to-service auth
    # (X-API-Key header). Empty disables auth — dev only, never leave unset
    # in production (see README "Autenticação").
    api_keys: str = ""

    @property
    def api_key_set(self) -> set[str]:
        return {key.strip() for key in self.api_keys.split(",") if key.strip()}


settings = Settings()
