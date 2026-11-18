// File: src/pages/public/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/services';
import type { Role } from '../../types';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('etudiant');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ nom, prenom, email, password, role });
      navigate('/login');
    } catch (err) {
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center space-x-2 text-indigo-600 mb-6">
        <UserPlus className="w-6 h-6" />
        <h2 className="text-2xl font-bold text-gray-900">Inscription</h2>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg">
            <option value="etudiant">Étudiant</option>
            <option value="enseignant">Enseignant</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
          S'inscrire
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Déjà un compte ? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
