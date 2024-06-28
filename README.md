# MY NOTES

When deploying to production, set the NEXTAUTH_URL environment variable to the canonical URL of your site.
NEXTAUTH_URL=https://example.com

npx prisma migrate dev --name init
npx prisma generate

npx prisma studio

# VS CODE BUILD

CTRL + SHIFT + B

# DEBUG PRISMA CLIENT

  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  })

  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query)
    console.log('Params: ' + e.params)
    console.log('Duration: ' + e.duration + 'ms')
  })

# MY TODO

 - fix add-new-file.js so that a files with the same filename wont overwrite themselves
 - fix new recipe thumbnail -> choose -> cancel -> error
 - animate recipe dashboard (not pretty after creating new recipe)
 - cache ingredients in selectIngredient.js
 - change recipe content to markdown and properly display it
   - admin preview
 - allow deleting recipe
 - add recipe to bag
 - crud for units
 - crud for ingredients
 - add share button for recipe
