import { getServerSession } from "next-auth/next"
import { PrismaClient } from '@prisma/client';
import { options } from 'app/api/auth/[...nextauth]/options'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, options)

  if (req.method === 'POST') {
    try {
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { recipeId, slider, ingredient } = req.body
      // TODO add validation
      
      const prisma = new PrismaClient();

      const user = await prisma.user.findUniqueOrThrow({
        where: {
          email: session.user.email,
        },
      });

      const recipeState = await prisma.recipeIngredientState.findUnique({
        where: {
          id: {
            recipeId: recipeId,
            userId: user.id,
          }
        },
      });

      if (recipeState) {
        const recipeStateUpdateData = {}
        if (slider) {
          recipeStateUpdateData["serves"] = parseInt(slider)
        }
        if (ingredient) {
          if (recipeState.state) {
            const prefix = recipeState.state.substr(0, ingredient.index);
            const flippedChar = recipeState.state[ingredient.index] === "0" ? "1" : "0";
            const suffix = recipeState.state.substr(ingredient.index + 1);
            
            recipeStateUpdateData["state"] = prefix + flippedChar + suffix;
          } else {
            recipeStateUpdateData["state"] = ingredient.newState;
          }
        }

        const updateRecipeState = await prisma.recipeIngredientState.update({
          where: {
            id: {
              recipeId: recipeId,
              userId: user.id,
            }
          },
          data: recipeStateUpdateData,
        })
      } else {
        const recipeStateCreateData = {
          recipeId: recipeId,
          userId: user.id,
        }
        if (slider) {
          recipeStateCreateData["serves"] = parseInt(slider)
        }
        if (ingredient) {
          recipeStateCreateData["state"] = ingredient.newState;
        }

        const createRecipeState = await prisma.recipeIngredientState.create({
          data: recipeStateCreateData,
        })
      }

      return res.status(200).json({ message: 'Recipe state changed successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'An error occured while changing recipe state' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
