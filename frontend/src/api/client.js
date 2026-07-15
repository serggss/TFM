export async function getAccount(state, accountId, userId) {
  const headers = {};
  if (userId !== null && userId !== undefined) {
    headers['X-User-Id'] = String(userId);
  }

  const response = await fetch(`/api/bola/${state}/accounts/${accountId}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

export async function searchAccounts(state, userId, targetOwnerId) {
  const headers = {};
  if (userId !== null && userId !== undefined) {
    headers['X-User-Id'] = String(userId);
  }

  let url = `/api/bola/${state}/accounts`;
  if (targetOwnerId !== null && targetOwnerId !== undefined) {
    url += `?ownerId=${targetOwnerId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

export async function getVulnerabilities() {
  const response = await fetch('/api/vulnerabilities');
  return response.json();
}

export async function getVulnerabilityBySlug(slug) {
  const response = await fetch(`/api/vulnerabilities/${slug}`);
  return response.json();
}

export async function getMonitorEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.vulnerability) params.set('vulnerability', filters.vulnerability);
  if (filters.state) params.set('state', filters.state);

  const queryString = params.toString();
  const url = `/api/monitor/events${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  return response.json();
}
