import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDecorations, Decoration, DecorationStatus, DecorationCategory } from '../contexts/DecorationContext';
import { DecorationFormDialog } from './DecorationFormDialog';
import { DecorationDetailsDialog } from './DecorationDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

const CATEGORY_ATTRIBUTE_FIELDS: Record<DecorationCategory, { key: string; label: string }[]> = {
  costume: [
    { key: 'size', label: 'Размер' },
    { key: 'color', label: 'Цвет' },
    { key: 'era', label: 'Эпоха' },
    { key: 'condition', label: 'Состояние' },
  ],
  furniture: [
    { key: 'type', label: 'Тип' },
    { key: 'material', label: 'Материал' },
    { key: 'dimensions', label: 'Габариты' },
    { key: 'period', label: 'Период/стиль' },
  ],
  background: [
    { key: 'type', label: 'Тип' },
    { key: 'size', label: 'Размер' },
    { key: 'theme', label: 'Тематика' },
  ],
  props: [
    { key: 'type', label: 'Тип' },
    { key: 'material', label: 'Материал' },
    { key: 'size', label: 'Размер' },
  ],
  construction: [
    { key: 'type', label: 'Тип' },
    { key: 'dimensions', label: 'Габариты' },
    { key: 'material', label: 'Материал' },
  ],
};

type AttributeFilterState = Record<DecorationCategory, Record<string, string>>;

const createEmptyAttributeFilters = (): AttributeFilterState => ({
  costume: {},
  furniture: {},
  background: {},
  props: {},
  construction: {},
});

const fieldMatches = (fieldValue: unknown, query: string): boolean => {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  if (!normalizedQuery) return true;
  return String(fieldValue ?? '').toLocaleLowerCase('ru-RU').includes(normalizedQuery);
};

export const DecorationManagement: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { decorations, deleteDecoration, updateDecoration } = useDecorations();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<DecorationCategory[]>([]);
  const [statusFilters, setStatusFilters] = useState<DecorationStatus[]>([]);
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilterState>(createEmptyAttributeFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [viewingDecoration, setViewingDecoration] = useState<Decoration | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const isManager = currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isManager || isAdmin;

  const getCategoryLabel = (category: DecorationCategory): string => {
    const labels = {
      costume: 'Костюм',
      furniture: 'Мебель и интерьер',
      background: 'Фон',
      props: 'Реквизит',
      construction: 'Конструкции'
    };
    return labels[category];
  };

  const getStatusLabel = (status: DecorationStatus): string => {
    const labels = {
      'in-stock': 'В наличии',
      'out-of-stock': 'Нет в наличии'
    };
    return labels[status];
  };

  const getStatusColor = (status: DecorationStatus): string => {
    const colors = {
      'in-stock': 'status-badge-in-stock',
      'out-of-stock': 'status-badge-out-of-stock'
    };
    return colors[status];
  };

  const toggleCategoryFilter = (category: DecorationCategory) => {
    setCategoryFilters(prev => {
      if (prev.includes(category)) {
        setAttributeFilters(current => ({ ...current, [category]: {} }));
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  const toggleStatusFilter = (status: DecorationStatus) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const updateAttributeFilter = (category: DecorationCategory, fieldKey: string, value: string) => {
    setAttributeFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [fieldKey]: value,
      },
    }));
  };

  const activeAttributeFilterCount = Object.values(attributeFilters).reduce((count, group) => {
    return count + Object.values(group).filter(value => value.trim()).length;
  }, 0);

  const activeFilterCount = categoryFilters.length + statusFilters.length + activeAttributeFilterCount;

  const resetFilters = () => {
    setCategoryFilters([]);
    setStatusFilters([]);
    setAttributeFilters(createEmptyAttributeFilters());
    setSearchQuery('');
  };

  const filteredDecorations = decorations.filter(decoration => {
    const matchesSearch = fieldMatches(decoration.name, searchQuery);
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(decoration.category);
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(decoration.status);
    const matchesAttributes = Object.entries(attributeFilters[decoration.category] || {}).every(([fieldKey, value]) => {
      if (!value.trim()) return true;
      return fieldMatches((decoration as unknown as Record<string, unknown>)[fieldKey], value);
    });

    return matchesSearch && matchesCategory && matchesStatus && matchesAttributes;
  });

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteDecoration(deletingId);
        toast.success('Декорация удалена');
        setDeletingId(null);
      } catch (error) {
        toast.error('Недостаточно прав для удаления декорации');
      }
    }
  };

  const handleStatusUpdate = async (newStatus: DecorationStatus) => {
    if (updatingStatusId) {
      try {
        await updateDecoration(updatingStatusId, { status: newStatus });
        toast.success('Статус обновлен');
        setUpdatingStatusId(null);
      } catch (error) {
        toast.error('Недостаточно прав для обновления статуса');
      }
    }
  };

  const canEditDecoration = (decoration: Decoration) => {
    if (isAdmin) return true;
    if (isManager) return decoration.authorId === currentUser?.id;
    return false;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      user: 'Пользователь',
      manager: 'Заведующий',
      admin: 'Администратор'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Управление декорациями</h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.firstName} {currentUser?.lastName} ({getRoleLabel(currentUser?.role || '')})
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={logout} variant="outline">
                <LogOut className="size-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="size-4 mr-2" />
              Фильтры
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-purple-600">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {(activeFilterCount > 0 || searchQuery) && (
              <Button
                variant="outline"
                onClick={resetFilters}
              >
                <X className="size-4 mr-2" />
                Сбросить
              </Button>
            )}
            {canEdit && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="size-4 mr-2" />
                Добавить декорацию
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-3 block">Категория</label>
                <div className="space-y-2">
                  {(['costume', 'furniture', 'background', 'props', 'construction'] as DecorationCategory[]).map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category}`}
                        checked={categoryFilters.includes(category)}
                        onCheckedChange={() => toggleCategoryFilter(category)}
                      />
                      <Label htmlFor={`cat-${category}`} className="cursor-pointer">
                        {getCategoryLabel(category)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">Статус</label>
                <div className="space-y-2">
                  {(['in-stock', 'out-of-stock'] as DecorationStatus[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={() => toggleStatusFilter(status)}
                      />
                      <Label htmlFor={`status-${status}`} className="cursor-pointer">
                        {getStatusLabel(status)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {categoryFilters.length > 0 && (
                <div className="md:col-span-2 border-t pt-4 space-y-5">
                  {categoryFilters.map(category => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">{getCategoryLabel(category)}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {CATEGORY_ATTRIBUTE_FIELDS[category].map(field => (
                          <div key={`${category}-${field.key}`}>
                            <Label htmlFor={`${category}-${field.key}`} className="text-xs mb-1 block">
                              {field.label}
                            </Label>
                            <Input
                              id={`${category}-${field.key}`}
                              value={attributeFilters[category][field.key] || ''}
                              onChange={(e) => updateAttributeFilter(category, field.key, e.target.value)}
                              placeholder=""
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Найдено декораций: {filteredDecorations.length}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecorations.map((decoration) => (
            <Card key={decoration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{decoration.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getCategoryLabel(decoration.category)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(decoration.status)}>
                    {getStatusLabel(decoration.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {decoration.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Всего:</span>
                    <span className="ml-1 font-semibold">{decoration.totalQuantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Доступно:</span>
                    <span className="ml-1 font-semibold">{decoration.availableQuantity}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Владелец: {decoration.ownerName}
                </div>

                <div className="text-xs text-gray-500">
                  Контактные данные: {decoration.ownerPhone}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingDecoration(decoration)}
                  >
                    <Eye className="size-4 mr-1" />
                    Просмотр
                  </Button>
                  {canEditDecoration(decoration) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDecoration(decoration)}
                      >
                        <Edit className="size-4 mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUpdatingStatusId(decoration.id)}
                      >
                        Обновить статус
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingId(decoration.id)}
                      >
                        <Trash2 className="size-4 mr-1" />
                        Удалить
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDecorations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Декорации не найдены</p>
          </div>
        )}
      </main>

      <DecorationFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          toast.success('Декорация добавлена');
        }}
      />

      {editingDecoration && (
        <DecorationFormDialog
          open={!!editingDecoration}
          onOpenChange={(open) => !open && setEditingDecoration(null)}
          decoration={editingDecoration}
          onSuccess={() => {
            setEditingDecoration(null);
            toast.success('Декорация обновлена');
          }}
        />
      )}

      {viewingDecoration && (
        <DecorationDetailsDialog
          decoration={viewingDecoration}
          open={!!viewingDecoration}
          onOpenChange={(open) => !open && setViewingDecoration(null)}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить эту декорацию? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!updatingStatusId} onOpenChange={(open) => !open && setUpdatingStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Обновить статус</AlertDialogTitle>
            <AlertDialogDescription>
              Выберите новый статус для декорации:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select onValueChange={(value) => handleStatusUpdate(value as DecorationStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-stock">В наличии</SelectItem>
                <SelectItem value="out-of-stock">Нет в наличии</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
