import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Decoration, DecorationStatus } from '../contexts/DecorationContext';

interface DecorationDetailsDialogProps {
  decoration: Decoration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DecorationDetailsDialog: React.FC<DecorationDetailsDialogProps> = ({
  decoration,
  open,
  onOpenChange
}) => {
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

  const getCategoryLabel = (category: string): string => {
    const labels = {
      costume: 'Костюм',
      furniture: 'Мебель и интерьер',
      background: 'Фон',
      props: 'Реквизит',
      construction: 'Конструкции'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const renderDetails = () => {
    const details: { label: string; value: string | number }[] = [
      { label: 'Название', value: decoration.name },
      { label: 'Категория', value: getCategoryLabel(decoration.category) },
      { label: 'Статус', value: getStatusLabel(decoration.status) },
      { label: 'Описание', value: decoration.description },
      { label: 'Общее количество', value: decoration.totalQuantity },
      { label: 'Доступно', value: decoration.availableQuantity },
      { label: 'Владелец', value: decoration.ownerName },
      { label: 'Контактные данные', value: decoration.ownerPhone }
    ];

    switch (decoration.category) {
      case 'costume':
        details.push(
          { label: 'Размер', value: decoration.size },
          { label: 'Цвет', value: decoration.color },
          { label: 'Эпоха', value: decoration.era },
          { label: 'Состояние', value: decoration.condition }
        );
        break;
      case 'furniture':
        details.push(
          { label: 'Тип', value: decoration.type },
          { label: 'Материал', value: decoration.material },
          { label: 'Размеры', value: decoration.dimensions },
          { label: 'Период', value: decoration.period }
        );
        break;
      case 'background':
        details.push(
          { label: 'Тип', value: decoration.type },
          { label: 'Размер', value: decoration.size },
          { label: 'Тематика', value: decoration.theme }
        );
        break;
      case 'props':
        details.push(
          { label: 'Тип', value: decoration.type },
          { label: 'Материал', value: decoration.material },
          { label: 'Размер', value: decoration.size }
        );
        break;
      case 'construction':
        details.push(
          { label: 'Тип', value: decoration.type },
          { label: 'Размеры', value: decoration.dimensions },
          { label: 'Материал', value: decoration.material }
        );
        break;
    }

    return details;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{decoration.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {getCategoryLabel(decoration.category)}
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(decoration.status)}>
              {getStatusLabel(decoration.status)}
            </Badge>
          </div>
        </DialogHeader>

        {/* Image */}
        {decoration.image && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <img 
              src={decoration.image} 
              alt={decoration.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="space-y-4 mt-4">
          {renderDetails().map((detail, index) => (
            <div key={index} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-gray-700">{detail.label}:</div>
              <div className="col-span-2 text-gray-900">{detail.value}</div>
            </div>
          ))}
          
          <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Создано: </span>
              <span className="text-gray-700">
                {new Date(decoration.createdAt).toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Последнее изменение: </span>
              <span className="text-gray-700">
                {new Date(decoration.lastEditedAt).toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
