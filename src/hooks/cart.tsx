import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProductsString = await AsyncStorage.getItem('@GoMarketplace/products');
      if (storedProductsString) {
        const storedProducts = JSON.parse(storedProductsString);
        await setProducts(storedProducts);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const productWithSameId = products.findIndex(p => p.id == product.id);
    
    if (productWithSameId != -1) {
      let newProducts = [...products];
      newProducts[productWithSameId].quantity += 1;
      setProducts(newProducts);
    }
    else {
      setProducts([...products, {...product, quantity: 1}]);
    }

    await AsyncStorage.setItem('@GoMarketplace/products', JSON.stringify(products));
  }, [products]);

  const increment = useCallback(async id => {
    const product = products.find(p => p.id == id);
    if (product) {
      const newProduct = {...product, quantity: product?.quantity + 1};
        
      await setProducts(products => products.map(p => {
        return p.id != id ? p : newProduct;
      }));

      await AsyncStorage.setItem('@GoMarketplace/products', JSON.stringify(products));
    }
  }, [products]);

  const decrement = useCallback(async id => {
    const product = products.find(p => p.id == id);
    if (product) {
      if (product.quantity > 1) {
        const newProduct = {...product, quantity: product?.quantity - 1};
        
        await setProducts(products => products.map(p => {
          return p.id != id ? p : newProduct;
        }));
      }
      else {
        await setProducts(products => products.filter(p => p.id != id));
      }

      await AsyncStorage.setItem('@GoMarketplace/products', JSON.stringify(products));
    }
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
