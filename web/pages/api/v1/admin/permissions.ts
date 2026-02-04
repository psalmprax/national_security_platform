import type { NextApiRequest, NextApiResponse } from 'next'

const permissions = [
    { id: '1', name: 'all', description: 'All permissions' },
    { id: '2', name: 'view_alerts', description: 'View alerts' },
    { id: '3', name: 'edit_alerts', description: 'Edit alerts' },
    { id: '4', name: 'view_users', description: 'View users' },
    { id: '5', name: 'edit_users', description: 'Edit users' },
]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(permissions)
}
