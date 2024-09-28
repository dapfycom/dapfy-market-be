import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosResponse } from 'axios';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Add this interface at the top of the file
interface IUnsplashResponse {
  // Define the structure of the Unsplash API response
  // This is a placeholder, adjust according to the actual response structure
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  // Add other properties as needed
}

@Injectable()
export class UnsplashService {
  private readonly baseUrl = 'https://api.unsplash.com';

  private readonly clientId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('UNSPLASH_CLIENT_ID');

    if (!clientId) {
      throw new Error('UNSPLASH_CLIENT_ID is not defined in the configuration');
    }

    this.clientId = clientId;
  }

  /**
   * List photos from the Editorial feed.
   * @param page - Page number to retrieve. (Optional; default: 1)
   * @param perPage - Number of items per page. (Optional; default: 10)
   * @returns An Observable of the photo list response.
   */
  public listPhotos(page = 1, perPage = 10): Observable<IUnsplashResponse[]> {
    return this.get<IUnsplashResponse[]>('/photos', {
      page,
      per_page: perPage,
    });
  }

  /**
   * Get a single photo by ID.
   * @param id - The photo's ID.
   * @returns An Observable of the photo response.
   */
  public getPhoto(id: string): Observable<IUnsplashResponse> {
    return this.get(`/photos/${id}`);
  }

  /**
   * Get random photos.
   * @param options - Optional parameters for filtering random photos.
   * @returns An Observable of the random photo(s) response.
   */
  public getRandomPhotos(
    options: IUnsplashRandomPhotoOptions = {},
  ): Observable<IUnsplashResponse | IUnsplashResponse[]> {
    return this.get('/photos/random', options);
  }

  private get<T>(
    endpoint: string,
    params: Record<string, string | number> | IUnsplashRandomPhotoOptions = {},
  ): Observable<T> {
    return this.httpService
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Client-ID ${this.clientId}`,
        },
        params: params as Record<string, string | number>,
      })
      .pipe(map((response: AxiosResponse<T>) => response.data));
  }
}

interface IUnsplashRandomPhotoOptions {
  collections?: string;
  topics?: string;
  username?: string;
  query?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  contentFilter?: 'low' | 'high';
  count?: number;
}
