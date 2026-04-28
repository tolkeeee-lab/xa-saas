/**
 * Auto-détecte la catégorie d'un produit à partir de son nom.
 * Retourne 'Général' si aucun mot-clé ne correspond.
 *
 * Pour ajouter de nouveaux mots-clés :
 *   1. Trouvez la règle correspondante dans RULES ci-dessous.
 *   2. Ajoutez le mot-clé (en minuscules, sans accents si possible) dans le tableau `keywords`.
 *   3. Si la catégorie n'existe pas encore, ajoutez un nouvel objet { categorie, keywords } à RULES.
 */

const RULES: { categorie: string; keywords: string[] }[] = [
  {
    categorie: 'Boissons',
    keywords: [
      'coca', 'cola', 'fanta', 'sprite', 'pepsi', 'mirinda', 'youki',
      'eau', 'jus', 'nectar', 'bissap', 'gaz', 'bière', 'biere', 'malta',
      'energy', 'redbull', 'cocktail', 'soda', 'schweppes', 'limonade',
      'lait', 'yaourt', 'yogourt', 'lactel', 'danone', 'peak', 'cebon',
      'danix', 'nido', 'gloria', 'dano', 'vitalait',
    ],
  },
  {
    categorie: 'Alimentaire',
    keywords: [
      'riz', 'maïs', 'mais', 'farine', 'sucre', 'sel', 'huile', 'palme',
      'tournesol', 'fritel', 'dinor', 'jumbo', 'sardine', 'thon', 'tomate',
      'concentré', 'concentre', 'pâte', 'pate', 'spaghetti', 'macaroni',
      'couscous', 'coquillette', 'idomi', 'maggi', 'cube', 'condiment',
      'poivre', 'piment', 'oignon', 'ail', 'gingembre', 'biscuit',
      'chocolat', 'bonbon', 'confiture', 'miel', 'beurre', 'margarine',
      'mayonnaise', 'ketchup', 'moutarde', 'vinaigre', 'haricot', 'lentille',
      'petit pois', 'pois', 'conserve', 'corned', 'saucisse',
      'selva', 'diari', 'bonjourne', 'sipa', 'avril',
    ],
  },
  {
    categorie: 'Hygiène',
    keywords: [
      'savon', 'lessive', 'dentifrice', 'brosse', 'rasoir', 'serviette',
      'omo', 'ariel', 'persil', 'skip', 'ajax', 'vif', 'détergent',
      'detergent', 'shampoing', 'shampooing', 'gel douche', 'déodorant',
      'deodorant', 'coton', 'ouate', 'mouchoir', 'papier toilette',
      'couche', 'pampers', 'always', 'kotex', 'protection', 'hygiénique',
    ],
  },
  {
    categorie: 'Ménage',
    keywords: [
      'balai', 'bougie', 'pile', 'allumette', 'marmite', 'casserole',
      'seau', 'bassine', 'éponge', 'eponge', 'serpillière', 'serpilliere',
      'poubelle', 'sac poubelle', 'fil', 'ampoule', 'lampe', 'torche',
      'briquet', 'insecticide', 'moustique', 'raid', 'baygon',
    ],
  },
  {
    categorie: 'Cosmétique',
    keywords: [
      'crème', 'creme', 'lotion', 'parfum', 'vaseline', 'nivea', 'pommade',
      'fond de teint', 'rouge', 'lèvres', 'levres', 'mascara', 'vernis',
      'huile cheveux', 'brillantine', 'fair', 'karite', 'karité',
    ],
  },
  {
    categorie: 'Santé',
    keywords: [
      'paracétamol', 'paracetamol', 'doliprane', 'ibuprofène', 'ibuprofene',
      'sirop', 'comprimé', 'comprimes', 'seringue', 'gant', 'masque',
      'désinfectant', 'desinfectant', 'alcool', 'betadine', 'pansement',
      'coton hydrophile', 'thermomètre', 'thermometre',
    ],
  },
  {
    categorie: 'Bébé',
    keywords: [
      'biberon', 'nestum', 'blédine', 'bledine',
      'lait bébé', 'lait bebe', 'céréale bébé', 'cereale bebe',
    ],
  },
  {
    categorie: 'Tabac',
    keywords: [
      'cigarette', 'marlboro', 'dunhill', 'chicha', 'tabac', 'cigare',
    ],
  },
  {
    categorie: 'Électronique',
    keywords: [
      'chargeur', 'câble', 'cable', 'recharge', 'casque', 'écouteur',
      'ecouteur', 'batterie', 'adaptateur', 'clé usb', 'cle usb',
    ],
  },
  {
    categorie: 'Vêtement',
    keywords: [
      'pagne', 'chemise', 'chaussure', 'casquette', 'chapeau', 'tshirt',
      't-shirt', 'pantalon', 'robe', 'jupe', 'short', 'chaussette',
    ],
  },
];

export function detectCategorie(nom: string): string {
  const lower = nom.toLowerCase().trim();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return rule.categorie;
      }
    }
  }
  return 'Général';
}
