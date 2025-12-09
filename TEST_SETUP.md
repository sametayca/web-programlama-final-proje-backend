# Test Veritabanı Kurulumu

Testleri çalıştırmak için PostgreSQL veritabanı gereklidir.

## Hızlı Başlangıç (Docker ile)

1. **Docker Desktop'ı başlatın**
   - Windows'ta Docker Desktop uygulamasını açın
   - Docker'ın çalıştığından emin olun

2. **PostgreSQL container'ını başlatın**
   ```bash
   docker-compose up -d postgres
   ```

3. **Test veritabanını oluşturun**
   ```bash
   npm run test:setup
   ```

4. **Testleri çalıştırın**
   ```bash
   npm test
   ```

   Veya tek komutla:
   ```bash
   npm run test:full
   ```

## Alternatif: Yerel PostgreSQL

Eğer Docker kullanmıyorsanız:

1. PostgreSQL'i yükleyin ve başlatın
2. Test veritabanını oluşturun:
   ```sql
   CREATE DATABASE web_programlama_final_proje_test;
   ```
3. `.env` dosyasında test veritabanı bilgilerini ayarlayın:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=web_programlama_final_proje_test
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```
4. Testleri çalıştırın:
   ```bash
   npm test
   ```

## Sorun Giderme

### Docker bağlantı hatası
- Docker Desktop'ın çalıştığından emin olun
- `docker ps` komutu ile Docker'ın çalıştığını kontrol edin

### Veritabanı bağlantı hatası
- PostgreSQL container'ının çalıştığını kontrol edin: `docker ps`
- Container loglarını kontrol edin: `docker logs backend-db`
- Test veritabanının oluşturulduğundan emin olun: `npm run test:setup`

