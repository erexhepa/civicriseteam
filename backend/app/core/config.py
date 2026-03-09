from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    llm_provider: str = "anthropic"
    llm_api_key: str = ""
    llm_model: str = ""
    llm_temperature: float = 0.7
    app_name: str = "Civic Copilot API"


settings = Settings()
