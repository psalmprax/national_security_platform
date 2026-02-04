import type { NextApiRequest, NextApiResponse } from 'next'

const auditLogs = [
    { id: '1', timestamp: new Date().toISOString(), actor: 'Admin', action: 'Update Clearance', target: 'John Doe', from: 'SECRET', to: 'TOP_SECRET', details: 'Promoted to new role' },
    { id: '2', timestamp: new Date().toISOString(), actor: 'Security Officer', action: 'Update Classification', target: 'Alert #123', from: 'CONFIDENTIAL', to: 'SECRET', details: 'Increased threat level' },
    { id: '3', timestamp: new Date().toISOString(), actor: 'Admin', action: 'Update Role', target: 'Jane Doe', from: 'USER', to: 'ADMIN', details: 'Promoted to administrator' },
]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(auditLogs)
}
