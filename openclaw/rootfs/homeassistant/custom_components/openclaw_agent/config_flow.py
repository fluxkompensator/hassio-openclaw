"""Config flow for OpenClaw Conversation Agent."""
from homeassistant import config_entries
import voluptuous as vol

DOMAIN = "openclaw_agent"


class OpenClawConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow for OpenClaw."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle a flow initialized by the user."""
        if user_input is not None:
            return self.async_create_entry(title="OpenClaw", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        "url", default="http://localhost:18789/api/chat"
                    ): str,
                    vol.Optional("token", default=""): str,
                }
            ),
        )
