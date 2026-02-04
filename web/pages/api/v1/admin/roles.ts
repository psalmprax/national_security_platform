import type { NextApiRequest, NextApiResponse } from 'next'

const roles = [
    { id: '1', name: 'Administrator', permissions: ['all'] },
    { id: '2', name: 'Security Officer', permissions: ['view_alerts', 'edit_alerts', 'view_users'] },
    { id: '3', name: 'User', permissions: ['view_alerts'] },
]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(roles)
}
