import { handleCheckRequest } from '../server/inspect.js'

export default async function handler(req, res) {
  await handleCheckRequest(req, res, req.url)
}
