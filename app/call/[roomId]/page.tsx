'use client';

import { use } from 'react';
import { useApp } from '@/components/app-context';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useRouter } from 'next/navigation';

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { user } = useApp();
  const router = useRouter();
  
  const { roomId } = use(params);

  // FIX: Removed the 'async' keyword here so it returns 'void' instead of a Promise!
  const myMeeting = (element: HTMLDivElement | null) => {
    if (!element || !user || !roomId) return;

    if (element.hasAttribute('data-zego-initialized')) return;
    element.setAttribute('data-zego-initialized', 'true');

    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET as string;
    
    const userIdStr = user._id?.toString() || Date.now().toString();
    const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      userIdStr, 
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall, 
      },
      turnOnCameraWhenJoining: false,
      showMyCameraToggleButton: false,
      showAudioVideoSettingsButton: false,
      showScreenSharingButton: false,
      showTextChat: false,
      onLeaveRoom: () => {
        const actualRideId = roomId.split('_')[0]; 
        router.push(`/ride/${actualRideId}`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#1C2333] flex flex-col h-[100dvh]">
      <div className="flex-1 w-full" ref={myMeeting} />
    </div>
  );
}