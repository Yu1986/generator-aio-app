/* <% if (false) { %>
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
<% } %> */

jest.mock('@adobe/aio-sdk', () => ({
  CampaignStandard: {
    init: jest.fn()
  },
  Core: {
    Logger: jest.fn()
  }
}))

const { Core, CampaignStandard } = require('@adobe/aio-sdk')
const mockCampaignStandardInstance = { getAllProfiles: jest.fn() }
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)
CampaignStandard.init.mockResolvedValue(mockCampaignStandardInstance)

const action = require('./<%= actionRelPath %>')

beforeEach(() => {
  CampaignStandard.init.mockClear() // only clears calls stats
  mockCampaignStandardInstance.getAllProfiles.mockReset() // clears calls + mock implementation

  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

const fakeRequestParams = { tenant: 'fake1', apiKey: 'fake2', token: 'fake3' }
describe('<%= actionName %>', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ ...fakeRequestParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })
  test('CampaignStandard sdk should be initialized with input credentials', async () => {
    await action.main({ ...fakeRequestParams, otherParam: 'fake4' })
    expect(CampaignStandard.init).toHaveBeenCalledWith(fakeRequestParams.tenant, fakeRequestParams.apiKey, fakeRequestParams.token)
  })
  test('should return an http response with CampaignStandard profiles', async () => {
    const fakeResponse = { profiles: 'fake' }
    mockCampaignStandardInstance.getAllProfiles.mockResolvedValue(fakeResponse)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual(expect.objectContaining({
      statusCode: 200,
      body: fakeResponse
    }))
  })
  test('if there is an error should return a 500 and log the error', async () => {
    const fakeError = new Error('fake')
    mockCampaignStandardInstance.getAllProfiles.mockRejectedValue(fakeError)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual(expect.objectContaining({
      statusCode: 500,
      body: { error: 'server error' }
    }))
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })
  test('if tenant is missing should return with 400', async () => {
    const response = await action.main({ apiKey: 'fake', token: 'fake' })
    expect(response).toEqual(expect.objectContaining({
      statusCode: 400
    }))
  })
  test('if apiKey is missing should return with 400', async () => {
    const response = await action.main({ tenant: 'fake', token: 'fake' })
    expect(response).toEqual(expect.objectContaining({
      statusCode: 400
    }))
  })
  test('if token is missing should return with 400', async () => {
    const response = await action.main({ apiKey: 'fake', tenant: 'fake' })
    expect(response).toEqual(expect.objectContaining({
      statusCode: 400
    }))
  })
})
