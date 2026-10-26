from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent

PROVIDER_URLS = {
    "openrouter": "https://openrouter.ai/api/v1",
    "openai": "https://api.openai.com/v1",
}


class Settings(BaseSettings):
    # Data
    data_dir: Path = BACKEND_DIR / "data"
    dataset_id: str = "ecommerce-multi-category-store"
    cors_origins: str = "http://localhost:5173"
    duckdb_memory_limit: str = "4GB"

    # AI provider: "openrouter", "openai", or "custom" (any OpenAI-compatible URL)
    ai_provider: str = "openrouter"
    ai_model: str = ""
    ai_base_url: str = ""  # only needed for "custom"
    ai_timeout_seconds: float = 45.0
    ai_temperature: float = 0.2
    app_url: str = "http://localhost:5173"

    openrouter_api_key: str = ""
    openai_api_key: str = ""
    ai_api_key: str = ""  # for "custom"

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def parquet_path(self) -> Path:
        return self.data_dir / "processed" / "events.parquet"

    @property
    def aggregate_path(self) -> Path:
        return self.data_dir / "processed" / "daily_product.parquet"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_base_url(self) -> str:
        return (self.ai_base_url or PROVIDER_URLS.get(self.ai_provider, "")).rstrip("/")

    @property
    def resolved_api_key(self) -> str:
        return {
            "openrouter": self.openrouter_api_key,
            "openai": self.openai_api_key,
        }.get(self.ai_provider, self.ai_api_key)

    @property
    def ai_enabled(self) -> bool:
        if not (self.ai_model and self.resolved_base_url):
            return False
        return self.ai_provider == "custom" or bool(self.resolved_api_key)


settings = Settings()