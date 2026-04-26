import React from 'react';
import { Button } from './ui/button';
import { Theater } from 'lucide-react';

interface HomePageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center space-y-8 p-8">
        <div className="flex justify-center">
          <div className="bg-purple-600 p-6 rounded-full">
            <Theater className="size-16 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Система управления декорациями
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Профессиональная система для управления театральными декорациями, костюмами и реквизитом
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button
            onClick={onLogin}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8"
          >
            Войти
          </Button>
          <Button
            onClick={onRegister}
            size="lg"
            variant="outline"
            className="px-8"
          >
            Зарегистрироваться
          </Button>
        </div>

        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Управление каталогом</h3>
            <p className="text-gray-600">Полный контроль над декорациями всех категорий</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Поиск и фильтры</h3>
            <p className="text-gray-600">Быстрый поиск по названию и атрибутам</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Статусы</h3>
            <p className="text-gray-600">Отслеживание доступности и состояния</p>
          </div>
        </div>
      </div>
    </div>
  );
};
