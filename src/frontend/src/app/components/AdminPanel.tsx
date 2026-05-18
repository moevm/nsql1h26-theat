import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ArrowLeft, Download, Database, Upload, Users } from "lucide-react";
import { useAuth, User, apiFetch, API_BASE_URL } from "../contexts/AuthContext";
import { useDecorations } from "../contexts/DecorationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface AdminPanelProps {
  onBack: () => void;
}

interface Stats {
  totalDecorations: number;
  inStock: number;
  outOfStock: number;
  totalUsers: number;
  byCategory: Record<
    string,
    {
      total: number;
      inStock: number;
      outOfStock: number;
      totalQuantity: number;
      availableQuantity: number;
    }
  >;
}

const CATEGORY_LABELS: Record<string, string> = {
  costume: "Костюмы",
  furniture: "Мебель и интерьер",
  background: "Фоны",
  props: "Реквизит",
  construction: "Конструкции",
};

const ROLE_LABELS: Record<string, string> = {
  user: "Пользователь",
  manager: "Заведующий",
  admin: "Администратор",
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { currentUser, getAllUsers, updateUserRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [backupName, setBackupName] = useState("");
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Stats>("/admin/stats")
      .then(setStats)
      .catch(() => toast.error("Не удалось загрузить статистику"));

    getAllUsers()
      .then(setUsers)
      .catch(() => toast.error("Не удалось загрузить список пользователей"));
  }, [getAllUsers]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const name = backupName.trim() || "theatre_backup";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Резервная копия создана и загружена");
      setBackupName("");
    } catch {
      toast.error("Ошибка при создании резервной копии");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setPendingImport(data);
        setShowRestoreDialog(true);
      } catch {
        toast.error("Ошибка чтения файла резервной копии");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmRestore = async () => {
    if (!pendingImport) return;
    try {
      const result = await apiFetch<{
        importedDecorations: number;
        importedUsers: number;
      }>("/admin/import", {
        method: "POST",
        body: JSON.stringify(pendingImport),
      });
      toast.success(
        `Импортировано: ${result.importedDecorations} декораций, ${result.importedUsers} пользователей`,
      );
    } catch {
      toast.error("Ошибка при восстановлении резервной копии");
    }
    setShowRestoreDialog(false);
    setPendingImport(null);
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "manager" | "admin",
  ) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success("Роль пользователя обновлена");
    } catch {
      toast.error("Не удалось обновить роль");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Панель администратора
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
            </div>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="size-4 mr-2" />
              Назад к декорациям
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Всего декораций</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.totalDecorations}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>В наличии</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.inStock}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Нет в наличии</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {stats.outOfStock}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalUsers}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Статистика по категориям</CardTitle>
                <CardDescription>
                  Количество декораций в каждой категории
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const cat = stats.byCategory[key];
                    return (
                      <div key={key} className="py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {label}
                          </span>
                          <span className="font-bold text-purple-600">
                            {cat?.total ?? 0}
                          </span>
                        </div>
                        {cat && (
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span>В наличии: {cat.inStock}</span>
                            <span>Нет в наличии: {cat.outOfStock}</span>
                            <span>
                              Доступно / Всего: {cat.availableQuantity} /{" "}
                              {cat.totalQuantity}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Управление пользователями
            </CardTitle>
            <CardDescription>
              Назначайте роли пользователям системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users
                .filter((u) => u.id !== currentUser?.id)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Логин: {user.login}
                      </div>
                      <div className="text-sm text-gray-500">
                        Текущая роль: {ROLE_LABELS[user.role] ?? user.role}
                      </div>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleRoleChange(
                          user.id,
                          value as "user" | "manager" | "admin",
                        )
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="manager">Заведующий</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              {users.filter((u) => u.id !== currentUser?.id).length === 0 && (
                <p className="text-sm text-gray-500">
                  Нет других пользователей
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Создать резервную копию
            </CardTitle>
            <CardDescription>
              Экспорт всех данных системы в JSON-файл
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupName">Имя файла (необязательно)</Label>
                <Input
                  id="backupName"
                  placeholder="Например: ежедневная-копия"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleExport}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="size-4 mr-2" />
                Создать резервную копию
              </Button>
              <p className="text-sm text-gray-500">
                Файл будет содержать все декорации и пользователей системы.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Восстановить резервную копию
            </CardTitle>
            <CardDescription>
              Импорт данных из ранее созданного файла
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupFile">
                  Выберите файл резервной копии (.json)
                </Label>
                <Input
                  id="backupFile"
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>
              <p className="text-sm text-gray-500">
                Записи с совпадающим ID будут обновлены, новые — добавлены.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Восстановление резервной копии</AlertDialogTitle>
            <AlertDialogDescription>
              Данные из файла будут импортированы в систему. Это действие нельзя
              отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingImport(null);
                onBack();
              }}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Восстановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
