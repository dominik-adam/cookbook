export interface ModuleConfig {
  title: string;
  url: string;
  image: string;
  publiclyAvailable: boolean;
}

export const MODULE_CONFIG: ModuleConfig[] = [
  { title: 'Profile',     url: '/profile',     image: '/icons/profile.png',      publiclyAvailable: true },
  { title: 'Recipes',     url: '/',            image: '/icons/recipes.png',      publiclyAvailable: true },
  { title: 'Drinks',      url: '/drinks',      image: '/icons/drinks.png',       publiclyAvailable: true },
  { title: 'Bag',         url: '/bag',         image: '/icons/shopping-bag.png', publiclyAvailable: true },
  { title: 'Workout',     url: '/workout',     image: '/icons/workout.png',      publiclyAvailable: false },
  { title: 'Ingredients', url: '/ingredients', image: '/icons/recipes.png',      publiclyAvailable: false },
];
