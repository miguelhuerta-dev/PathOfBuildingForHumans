//! The app's HTTP client: one per app so connections and TLS sessions are
//! reused, always with the app's user agent and a time limit.

use std::sync::OnceLock;
use std::time::Duration;

pub const USER_AGENT: &str = concat!(
    "PathOfBuildingForHumans/",
    env!("CARGO_PKG_VERSION"),
    " (+https://github.com/miguelhuerta-dev/PathOfBuildingForHumans)"
);

/// Default limit for a whole request; slower calls set their own with `RequestBuilder::timeout`.
const TIMEOUT: Duration = Duration::from_secs(20);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

pub fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent(USER_AGENT)
            .timeout(TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            // Building only fails if the TLS backend cannot start; the default client still works.
            .unwrap_or_default()
    })
}

/// For code that already runs on a blocking thread (the calculation engine).
pub fn blocking_client() -> &'static reqwest::blocking::Client {
    static CLIENT: OnceLock<reqwest::blocking::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::blocking::Client::builder()
            .user_agent(USER_AGENT)
            .timeout(TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .unwrap_or_default()
    })
}
