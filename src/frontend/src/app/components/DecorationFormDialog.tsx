import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useDecorations, Decoration, DecorationCategory, DecorationStatus } from '../contexts/DecorationContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface DecorationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decoration?: Decoration;
  onSuccess: () => void;
}

export const DecorationFormDialog: React.FC<DecorationFormDialogProps> = ({
  open,
  onOpenChange,
  decoration,
  onSuccess
}) => {
  const { addDecoration, updateDecoration } = useDecorations();
  const { currentUser } = useAuth();
  const isEditing = !!decoration;

  const [category, setCategory] = useState<DecorationCategory>(decoration?.category || 'costume');
  const [formData, setFormData] = useState({
    name: decoration?.name || '',
    description: decoration?.description || '',
    status: (decoration?.status || 'in-stock') as DecorationStatus,
    totalQuantity: decoration?.totalQuantity || 0,
    availableQuantity: decoration?.availableQuantity || 0,
    ownerName: decoration?.ownerName || '',
    ownerPhone: decoration?.ownerPhone || '',
    image: decoration?.image || '',

    size: '',
    color: '',
    era: '',
    condition: '',

    type: '',
    material: '',
    dimensions: '',
    period: '',

    backgroundType: '',
    backgroundSize: '',
    theme: '',

    propsType: '',
    propsMaterial: '',
    propsSize: '',

    constructionType: '',
    constructionDimensions: '',
    constructionMaterial: ''
  });

  useEffect(() => {
    if (decoration) {
      setCategory(decoration.category);
      setFormData({
        name: decoration.name,
        description: decoration.description,
        status: decoration.status,
        totalQuantity: decoration.totalQuantity,
        availableQuantity: decoration.availableQuantity,
        ownerName: decoration.ownerName,
        ownerPhone: decoration.ownerPhone,
        image: decoration.image || '',
        size: 'size' in decoration ? decoration.size : '',
        color: 'color' in decoration ? decoration.color : '',
        era: 'era' in decoration ? decoration.era : '',
        condition: 'condition' in decoration ? decoration.condition : '',
        type: 'type' in decoration ? decoration.type : '',
        material: 'material' in decoration ? decoration.material : '',
        dimensions: 'dimensions' in decoration ? decoration.dimensions : '',
        period: 'period' in decoration ? decoration.period : '',
        backgroundType: 'type' in decoration && decoration.category === 'background' ? decoration.type : '',
        backgroundSize: 'size' in decoration && decoration.category === 'background' ? decoration.size : '',
        theme: 'theme' in decoration ? decoration.theme : '',
        propsType: 'type' in decoration && decoration.category === 'props' ? decoration.type : '',
        propsMaterial: 'material' in decoration && decoration.category === 'props' ? decoration.material : '',
        propsSize: 'size' in decoration && decoration.category === 'props' ? decoration.size : '',
        constructionType: 'type' in decoration && decoration.category === 'construction' ? decoration.type : '',
        constructionDimensions: 'dimensions' in decoration && decoration.category === 'construction' ? decoration.dimensions : '',
        constructionMaterial: 'material' in decoration && decoration.category === 'construction' ? decoration.material : ''
      });
    }
  }, [decoration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const createdBy = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown';

    const baseData = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      totalQuantity: Number(formData.totalQuantity),
      availableQuantity: Number(formData.availableQuantity),
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      image: formData.image,
      createdBy: decoration?.createdBy || createdBy,
      lastEditedAt: new Date().toISOString(),
      category
    };

    let decorationData: any = baseData;

    switch (category) {
      case 'costume':
        decorationData = {
          ...baseData,
          size: formData.size,
          color: formData.color,
          era: formData.era,
          condition: formData.condition
        };
        break;
      case 'furniture':
        decorationData = {
          ...baseData,
          type: formData.type,
          material: formData.material,
          dimensions: formData.dimensions,
          period: formData.period
        };
        break;
      case 'background':
        decorationData = {
          ...baseData,
          type: formData.backgroundType,
          size: formData.backgroundSize,
          theme: formData.theme
        };
        break;
      case 'props':
        decorationData = {
          ...baseData,
          type: formData.propsType,
          material: formData.propsMaterial,
          size: formData.propsSize
        };
        break;
      case 'construction':
        decorationData = {
          ...baseData,
          type: formData.constructionType,
          dimensions: formData.constructionDimensions,
          material: formData.constructionMaterial
        };
        break;
    }

    try {
      if (isEditing && decoration) {
        await updateDecoration(decoration.id, decorationData);
      } else {
        await addDecoration(decorationData);
      }

      onSuccess();
    } catch (error) {
      alert('Недостаточно прав или данные заполнены неверно');
    }
  };

  const renderCategoryFields = () => {
    switch (category) {
      case 'costume':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="size">Размер</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Цвет</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="era">Эпоха</Label>
              <Input
                id="era"
                value={formData.era}
                onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Состояние</Label>
              <Input
                id="condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                required
              />
            </div>
          </>
        );

      case 'furniture':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="type">Тип</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Материал</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Размеры</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Период</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                required
              />
            </div>
          </>
        );

      case 'background':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="backgroundType">Тип</Label>
              <Input
                id="backgroundType"
                value={formData.backgroundType}
                onChange={(e) => setFormData({ ...formData, backgroundType: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundSize">Размер</Label>
              <Input
                id="backgroundSize"
                value={formData.backgroundSize}
                onChange={(e) => setFormData({ ...formData, backgroundSize: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Тематика</Label>
              <Input
                id="theme"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                required
              />
            </div>
          </>
        );

      case 'props':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="propsType">Тип</Label>
              <Input
                id="propsType"
                value={formData.propsType}
                onChange={(e) => setFormData({ ...formData, propsType: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propsMaterial">Материал</Label>
              <Input
                id="propsMaterial"
                value={formData.propsMaterial}
                onChange={(e) => setFormData({ ...formData, propsMaterial: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propsSize">Размер</Label>
              <Input
                id="propsSize"
                value={formData.propsSize}
                onChange={(e) => setFormData({ ...formData, propsSize: e.target.value })}
                required
              />
            </div>
          </>
        );

      case 'construction':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="constructionType">Тип</Label>
              <Input
                id="constructionType"
                value={formData.constructionType}
                onChange={(e) => setFormData({ ...formData, constructionType: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constructionDimensions">Размеры</Label>
              <Input
                id="constructionDimensions"
                value={formData.constructionDimensions}
                onChange={(e) => setFormData({ ...formData, constructionDimensions: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constructionMaterial">Материал</Label>
              <Input
                id="constructionMaterial"
                value={formData.constructionMaterial}
                onChange={(e) => setFormData({ ...formData, constructionMaterial: e.target.value })}
                required
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактирование декорации' : 'Добавление декорации'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Измените данные декорации' : 'Заполните форму для добавления новой декорации'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as DecorationCategory)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="costume">Костюм</SelectItem>
                <SelectItem value="furniture">Мебель и интерьер</SelectItem>
                <SelectItem value="background">Фон</SelectItem>
                <SelectItem value="props">Реквизит</SelectItem>
                <SelectItem value="construction">Конструкции</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as DecorationStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-stock">В наличии</SelectItem>
                <SelectItem value="out-of-stock">Нет в наличии</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalQuantity">Общее количество</Label>
            <Input
              id="totalQuantity"
              type="number"
              value={formData.totalQuantity}
              onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableQuantity">Доступное количество</Label>
            <Input
              id="availableQuantity"
              type="number"
              value={formData.availableQuantity}
              onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Владелец (ФИО)</Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPhone">Контактные данные (телефон)</Label>
            <Input
              id="ownerPhone"
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              placeholder="+7 (900) 123-45-67"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Изображение (URL)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {renderCategoryFields()}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="size-4 mr-2" />
              {isEditing ? 'Отмена' : 'Назад'}
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};