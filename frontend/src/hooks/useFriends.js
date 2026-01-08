import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "@/lib/api";

export function useFriends() {
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const response = await friendsApi.getAll();
      return response.data.data.friends;
    },
  });

  const pendingQuery = useQuery({
    queryKey: ["friends", "pending"],
    queryFn: async () => {
      const response = await friendsApi.getPending();
      return response.data.data;
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (friendId) => friendsApi.sendRequest(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }) => friendsApi.updateRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (id) => friendsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  return {
    friends: friendsQuery.data || [],
    pending: pendingQuery.data || { received: [], sent: [] },
    isLoading: friendsQuery.isLoading || pendingQuery.isLoading,
    sendRequest: sendRequestMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
    updateRequestAsync: updateRequestMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutate,
    isSendingRequest: sendRequestMutation.isPending,
    isUpdatingRequest: updateRequestMutation.isPending,
    isRemovingFriend: removeFriendMutation.isPending,
  };
}





