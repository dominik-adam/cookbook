import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'

export default async function handler(req, res) {
  const session = await getServerSession(context.req, context.res, options)

  if (req.method === 'POST') {
    try {
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the updated shopping cart data from the request body
      const ingredientsState = req.body;

      // Save the updated cart data to your server (e.g., database)
      // You may use a database client or any other storage mechanism

      // Respond with a success message or the updated cart data
      return res.status(200).json({ message: 'Ingredients state updated successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
