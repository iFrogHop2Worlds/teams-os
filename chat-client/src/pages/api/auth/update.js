import { authOptions } from './[...nextauth]'
import { getServerSession } from "next-auth/next"
import bcryptjs from 'bcryptjs';
import Users from '@/models/User';
import db from '../../../utils/db';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(400).send({ message: `${req.method} not supported` });
  }
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).send({ message: 'signin required' });
  }

  const { name, password, user_id } = req.body;

  if (
    !name ||
    (password && password.trim().length < 5)
  ) {
    res.status(422).json({
      message: 'Validation error',
    });
    return;
  }

  await db.connect();
  const toUpdateUser = await Users.findById(user_id);
  const toUpdateClass = await Classes.find({registrees: toUpdateUser.name})
  for(let i = 0; i < toUpdateClass.length; i++) {
    toUpdateClass[i].registrees[toUpdateClass[i].registrees.indexOf(toUpdateUser.name)] = name
    await toUpdateClass[i].save();
  }
  toUpdateUser.name = name;
  if (password) {
    toUpdateUser.password = bcryptjs.hashSync(password);
  }
  await toUpdateUser.save()
  await db.disconnect();
  res.send({
    message: 'User updated',
  });
}

export default handler;