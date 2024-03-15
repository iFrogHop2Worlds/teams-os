import Users from '@/models/User';
import db from '@/utils/db'

export default async function handler(req, res) {
    await db.connect();
    const users = await Users.find({}).lean();
    res.status(200).json(users.map(db.convertDocToObj));
}