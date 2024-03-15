'use server'
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]"

export default async function handler(req, res) {
    const session = await getServerSession(authOptions);
    res.status(200).json(session);
  }