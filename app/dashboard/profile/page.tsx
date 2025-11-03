"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/useApi';
import { Loader2, Edit, Save, X } from 'lucide-react';

interface UserProfile {
  uid: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  display_name: string;
  is_verified: boolean;
  contact_method: string;
  created_at: string;
  updated_at: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();
  const apiFetch = useApi();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch(`${baseUrl}api/auth/profile/`);
        setProfile(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [apiFetch, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedProfile = await apiFetch(`${baseUrl}api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setProfile(updatedProfile);
      setEditing(false);
      // Success toast is automatically shown by useApi hook for non-GET requests
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Failed to load profile. Please try again later.</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button 
              onClick={() => setEditing(false)} 
              variant="outline" 
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={profile.display_name} />
              <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-bold">{profile.display_name}</div>
              <div className="text-sm text-muted-foreground">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {editing ? (
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="text-sm">{profile.first_name}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {editing ? (
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="text-sm">{profile.last_name}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {editing ? (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{profile.email}</span>
                  {profile.email_verified ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Unverified
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {editing ? (
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{profile.phone}</span>
                  {profile.phone_verified ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Unverified
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-1">
                <div className="text-sm font-medium">Account Status</div>
                <div>
                  <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Preferred Contact Method</div>
                <div>
                  <Badge variant="outline">
                    {profile.contact_method === 'email' ? 'Email' : 'Phone'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
       </div>
  );
}