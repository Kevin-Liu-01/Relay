// An explicit CLI campaign policy, never enabled by the hosted playground.
export function retainedRequestTimeout(config, episode) {
  return (
    config.continueAfterRequestTimeout === true &&
    episode.status === 'timeout' &&
    episode.usageKnown === false &&
    !episode.cleanupError &&
    Number.isFinite(episode.requestTimeoutReservationUSD) &&
    episode.requestTimeoutReservationUSD > 0 &&
    episode.estimatedUSD >= episode.requestTimeoutReservationUSD
  );
}

export function acceptedOutputLimit(config, episode) {
  return (
    config.continueAfterOutputLimit === true &&
    episode.status === 'output_limit' &&
    episode.usageKnown === true &&
    episode.outputLimitUsageAccepted === true &&
    !episode.cleanupError
  );
}

export function retainedConnectionFailure(config, episode) {
  return (
    config.continueAfterConnectionFailure === true &&
    episode.status === 'provider_connection_error' &&
    episode.usageKnown === false &&
    !episode.cleanupError &&
    Number.isFinite(episode.connectionFailureReservationUSD) &&
    episode.connectionFailureReservationUSD > 0 &&
    episode.estimatedUSD >= episode.connectionFailureReservationUSD
  );
}

export function acceptedEpisodeDeadline(config, episode) {
  return (
    config.continueAfterEpisodeTimeout === true &&
    episode.status === 'timeout' &&
    episode.usageKnown === true &&
    !episode.cleanupError
  );
}
