import { describe, it, expect } from 'vitest'
import { apiErrorMessage, isPermissionError } from './apiError'

/** Shape axios hands a component when the server rejects a request. */
const httpError = (status, detail) => ({ response: { status, data: { detail } } })

describe('apiErrorMessage', () => {
    it('prefers the explanation the server actually sent', () => {
        const err = httpError(403, 'Staff members cannot perform this action')

        expect(apiErrorMessage(err, 'Failed to load staff members'))
            .toBe('Staff members cannot perform this action')
    })

    it('falls back when the server said nothing useful', () => {
        expect(apiErrorMessage(httpError(500, undefined), 'Failed to load staff members'))
            .toBe('Failed to load staff members')
    })

    it('falls back when there is no response at all', () => {
        expect(apiErrorMessage(new Error('Network Error'), 'Failed to load staff members'))
            .toBe('Failed to load staff members')
    })

    it('ignores a validation payload, which is a list rather than a sentence', () => {
        // FastAPI returns detail as an array of field errors on a 422. Rendering
        // that raw puts "[object Object]" in front of a clinician.
        const err = httpError(422, [{ loc: ['body', 'name'], msg: 'field required' }])

        expect(apiErrorMessage(err, 'Could not save')).toBe('Could not save')
    })

    it('ignores an empty or whitespace-only detail', () => {
        expect(apiErrorMessage(httpError(400, '   '), 'Could not save')).toBe('Could not save')
    })
})

describe('isPermissionError', () => {
    it('recognises a refusal', () => {
        expect(isPermissionError(httpError(403, 'Staff members cannot perform this action'))).toBe(true)
    })

    it('does not treat a server fault as a refusal', () => {
        expect(isPermissionError(httpError(500, 'Internal Server Error'))).toBe(false)
    })

    it('does not treat a network failure as a refusal', () => {
        expect(isPermissionError(new Error('Network Error'))).toBe(false)
    })
})
