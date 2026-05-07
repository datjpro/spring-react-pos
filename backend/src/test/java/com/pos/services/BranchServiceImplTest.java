package com.pos.services;

import com.pos.common.exception.DuplicateResourceException;
import com.pos.common.exception.ResourceNotFoundException;
import com.pos.dtos.request.BranchRequest;
import com.pos.dtos.response.BranchResponse;
import com.pos.entities.BranchEntity;
import com.pos.repositories.BranchRepository;
import com.pos.services.impl.BranchServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BranchServiceImplTest {

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private BranchServiceImpl branchService;

    @Test
    void shouldCreateBranchSuccessfully() {
        BranchRequest request = new BranchRequest("CN-01", "Main", "Address");
        BranchEntity entity = new BranchEntity();
        entity.setId(1L);
        entity.setCode("CN-01");
        entity.setName("Main");
        entity.setAddress("Address");
        entity.setActive(true);

        when(branchRepository.existsByCodeIgnoreCase("CN-01")).thenReturn(false);
        when(branchRepository.save(any(BranchEntity.class))).thenReturn(entity);

        BranchResponse response = branchService.create(request);

        assertEquals("CN-01", response.code());
        assertEquals("Main", response.name());
    }

    @Test
    void shouldThrowDuplicateWhenCodeExists() {
        BranchRequest request = new BranchRequest("CN-01", "Main", "Address");
        when(branchRepository.existsByCodeIgnoreCase("CN-01")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> branchService.create(request));
    }

    @Test
    void shouldFindBranchByIdSuccessfully() {
        BranchEntity entity = new BranchEntity();
        entity.setId(1L);
        entity.setCode("CN-01");
        entity.setName("Main");
        entity.setAddress("Address");
        entity.setActive(true);

        when(branchRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));

        BranchResponse response = branchService.findById(1L);

        assertEquals(1L, response.id());
        assertEquals("CN-01", response.code());
    }

    @Test
    void shouldThrowNotFoundWhenBranchMissing() {
        when(branchRepository.findByIdAndActiveTrue(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> branchService.findById(99L));
    }

    @Test
    void shouldFindAllActiveBranchesSuccessfully() {
        BranchEntity entity = new BranchEntity();
        entity.setId(1L);
        entity.setCode("CN-01");
        entity.setName("Main");
        entity.setActive(true);

        when(branchRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(entity));

        List<BranchResponse> responses = branchService.findAll();

        assertEquals(1, responses.size());
        assertEquals("CN-01", responses.get(0).code());
    }

    @Test
    void shouldSoftDeleteBranchSuccessfully() {
        BranchEntity entity = new BranchEntity();
        entity.setId(1L);
        entity.setActive(true);

        when(branchRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(entity));

        branchService.delete(1L);

        assertFalse(entity.isActive());
        verify(branchRepository).findByIdAndActiveTrue(1L);
    }
}
