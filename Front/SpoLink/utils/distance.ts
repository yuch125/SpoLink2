// C:\Back\Front\SpoLink\utils\distance.ts

/**
 * 두 위경도 간의 거리를 미터 단위로 계산 (Haversine 공식)
 * @param lat1 첫 번째 지점 위도
 * @param lon1 첫 번째 지점 경도
 * @param lat2 두 번째 지점 위도
 * @param lon2 두 번째 지점 경도
 * @returns 미터 단위 거리 (정수)
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // 지구 반지름 (m)
  
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
  
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return Math.floor(R * c); // 미터 단위 반환
  }
  
  