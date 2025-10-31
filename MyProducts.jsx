import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { LinkIcon, CheckIcon, PencilAltIcon, TrashIcon, EyeIcon, EyeOffIcon, ShoppingCartIcon } from '@heroicons/react/solid';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [copiedCheckoutLinkId, setCopiedCheckoutLinkId] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "products"), where("authorId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const userProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(userProducts);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error("Falha ao carregar seus produtos.");
      }
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleCopyLink = (productId, type) => {
    const isCheckout = type === 'checkout';
    const url = isCheckout
      ? `${window.location.origin}/checkout/${productId}`
      : `${window.location.origin}/product/${productId}`;

    navigator.clipboard.writeText(url).then(() => {
      if (isCheckout) {
        setCopiedCheckoutLinkId(productId);
        toast.success("Link de Checkout copiado!");
        setTimeout(() => setCopiedCheckoutLinkId(null), 2500);
      } else {
        setCopiedLinkId(productId);
        toast.success("Link do Produto copiado!");
        setTimeout(() => setCopiedLinkId(null), 2500);
      }
    }).catch(err => {
      console.error("Erro ao copiar o link:", err);
      toast.error("Não foi possível copiar o link.");
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, { status: newStatus });
      setProducts(products.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.info(`Produto ${newStatus === 'Ativo' ? 'ativado' : 'desativado'}.`);
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      toast.error("Falha ao alterar o status do produto.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este produto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter(p => p.id !== id));
        toast.success("Produto apagado com sucesso.");
      } catch (error) {
        console.error("Erro ao apagar produto:", error);
        toast.error("Falha ao apagar o produto.");
      }
    }
  };

  if (loading) {
    return <div className="text-center p-10">Carregando seus produtos...</div>;
  }

  if (!user) {
    return <div className="text-center p-10">Por favor, faça login para ver seus produtos.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Meus Produtos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h3 className="text-lg font-bold text-gray-800">{product.productName}</h3>
              <p className="text-green-600 font-semibold">MT {product.price?.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-semibold ${product.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.status}
                </span>
                <span className={`px-2 py-1 rounded-full font-semibold ${product.approvalStatus === 'Aprovado' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {product.approvalStatus}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button className="flex-1 text-sm py-2 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold flex items-center justify-center gap-1.5">
                  <PencilAltIcon className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => handleToggleStatus(product.id, product.status)} className="flex-1 text-sm py-2 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold flex items-center justify-center gap-1.5">
                  {product.status === 'Ativo' ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />} {product.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {/* ✅ BOTÃO ATUALIZADO: Copia o link de checkout diretamente */}
              <motion.button
                onClick={() => handleCopyCheckoutLink(product.id)}
                className="w-full py-2 rounded-md bg-green-600 text-white font-bold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {copiedCheckoutLinkId === product.id ? <CheckIcon className="w-5 h-5" /> : <ShoppingCartIcon className="w-5 h-5" />}
                {copiedCheckoutLinkId === product.id ? "Link de Checkout Copiado!" : "Copiar Link de Checkout"}
              </motion.button>

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyProducts;