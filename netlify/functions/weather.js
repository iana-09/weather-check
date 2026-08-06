const allowedEndpoints = new Set(['weather', 'forecast'])

exports.handler = async (event) => {
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
        return jsonResponse(500, {
            message: 'Weather API key is not configured. Add OPENWEATHER_API_KEY in Netlify environment variables.'
        })
    }

    const query = event.queryStringParameters || {}
    const endpoint = query.endpoint

    if (!allowedEndpoints.has(endpoint)) {
        return jsonResponse(400, { message: 'Invalid weather endpoint.' })
    }

    const hasCity = typeof query.q === 'string' && query.q.trim() !== ''
    const hasCoords = typeof query.lat === 'string' && typeof query.lon === 'string'

    if (!hasCity && !hasCoords) {
        return jsonResponse(400, { message: 'Search for a city or allow current location.' })
    }

    const searchParams = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
        if (key !== 'endpoint' && typeof value === 'string') {
            searchParams.set(key, value)
        }
    })
    searchParams.set('appid', apiKey)

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/${endpoint}?${searchParams.toString()}`, {
            headers: { accept: 'application/json' }
        })
        const body = await response.text()

        return {
            statusCode: response.status,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store'
            },
            body
        }
    } catch (error) {
        return jsonResponse(502, { message: 'Weather service did not respond. Please retry.' })
    }
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
        },
        body: JSON.stringify(body)
    }
}
