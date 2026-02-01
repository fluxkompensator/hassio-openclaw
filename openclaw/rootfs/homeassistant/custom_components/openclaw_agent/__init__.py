"""OpenClaw Conversation Agent for Home Assistant."""
import logging
from typing import Literal

from homeassistant.components import conversation
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import voluptuous as vol

_LOGGER = logging.getLogger(__name__)

DOMAIN = "openclaw_agent"

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema(
            {
                vol.Optional("url", default="http://localhost:18789/api/chat"): cv.url,
                vol.Optional("token", default=""): cv.string,
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the OpenClaw conversation agent."""
    if DOMAIN not in config:
        return True

    conf = config[DOMAIN]
    agent = OpenClawConversationAgent(hass, conf)
    conversation.async_set_agent(hass, config_entry=None, agent=agent)

    _LOGGER.info("OpenClaw conversation agent registered")
    return True


class OpenClawConversationAgent(conversation.AbstractConversationAgent):
    """OpenClaw conversation agent implementation."""

    def __init__(self, hass: HomeAssistant, config: dict) -> None:
        """Initialize the agent."""
        self.hass = hass
        self.url = config.get("url", "http://localhost:18789/api/chat")
        self.token = config.get("token", "")

    @property
    def supported_languages(self) -> list[str] | Literal["*"]:
        """Return supported languages."""
        return ["de", "en"]

    async def async_process(
        self, user_input: conversation.ConversationInput
    ) -> conversation.ConversationResult:
        """Process a sentence."""
        session = async_get_clientsession(self.hass)

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            async with session.post(
                self.url,
                json={"message": user_input.text},
                headers=headers,
                timeout=60,
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    response_text = data.get("response", data.get("text", ""))
                else:
                    _LOGGER.error("OpenClaw API error: %s", resp.status)
                    response_text = "Sorry, I couldn't process that request."
        except Exception as e:
            _LOGGER.error("OpenClaw connection error: %s", e)
            response_text = "Sorry, there was an error connecting to OpenClaw."

        intent_response = conversation.IntentResponse(language=user_input.language)
        intent_response.async_set_speech(response_text)

        return conversation.ConversationResult(
            response=intent_response,
            conversation_id=user_input.conversation_id,
        )
